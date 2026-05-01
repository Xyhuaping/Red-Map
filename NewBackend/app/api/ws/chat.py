from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
import json

from app.core.database import SessionLocal
from app.core.security import decode_token
from app.core.exceptions import UnauthorizedException
from app.services.chat import ChatService
from app.schemas.chat import WsChatMessage, WsChatChunk, WsChatDone, WsChatError

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        self.active_connections.pop(user_id, None)

    async def send_json(self, user_id: int, data: dict):
        ws = self.active_connections.get(user_id)
        if ws:
            await ws.send_json(data)


manager = ConnectionManager()


def authenticate_websocket(token: str) -> int | None:
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        return None
    sub = payload.get("sub")
    if not sub:
        return None
    return sub


@router.websocket("/chat")
async def websocket_chat(websocket: WebSocket, token: str = None):
    if not token:
        token = websocket.query_params.get("token")

    if not token:
        await websocket.close(code=4001, reason="Missing authentication token")
        return

    username = authenticate_websocket(token)
    if not username:
        await websocket.close(code=4001, reason="Invalid authentication token")
        return

    db = SessionLocal()
    try:
        from app.repositories.user import UserRepository
        user_repo = UserRepository(db)
        user = user_repo.get_by_username(username)
        if not user or not user.is_active:
            await websocket.close(code=4003, reason="User not found or inactive")
            return

        user_id = user.id
        await manager.connect(user_id, websocket)

        try:
            while True:
                data = await websocket.receive_text()
                try:
                    msg = json.loads(data)
                    figure_id = msg.get("figure_id")
                    message = msg.get("message", "")

                    if not figure_id or not message:
                        await manager.send_json(user_id, WsChatError(message="缺少figure_id或message").model_dump())
                        continue

                    chat_service = ChatService(db)

                    from app.models.conversation import Conversation
                    db.add(Conversation(
                        user_id=user_id,
                        figure_id=figure_id,
                        role="user",
                        content=message,
                    ))
                    db.commit()

                    from app.repositories.figure import FigureRepository
                    figure_repo = FigureRepository(db)
                    figure = figure_repo.get_by_id(figure_id)
                    if not figure:
                        await manager.send_json(user_id, WsChatError(message="人物不存在").model_dump())
                        continue

                    system_prompt = figure.prompt_template or f"你是{figure.name}，{figure.title}。请用温暖的语气与用户对话。"
                    messages = [{"role": "system", "content": system_prompt}]

                    from app.repositories.conversation import ConversationRepository
                    conv_repo = ConversationRepository(db)
                    history = conv_repo.get_by_user_and_figure(user_id, figure_id, limit=10)
                    for h in reversed(history):
                        messages.append({"role": h.role, "content": h.content})
                    messages.append({"role": "user", "content": message})

                    full_text = ""
                    async for chunk in chat_service.stream_glm(messages):
                        full_text += chunk
                        await manager.send_json(user_id, WsChatChunk(text=chunk).model_dump())

                    db.add(Conversation(
                        user_id=user_id,
                        figure_id=figure_id,
                        role="assistant",
                        content=full_text,
                    ))
                    db.commit()

                    await manager.send_json(user_id, WsChatDone(full_text=full_text).model_dump())

                except json.JSONDecodeError:
                    await manager.send_json(user_id, WsChatError(message="无效的消息格式").model_dump())

        except WebSocketDisconnect:
            manager.disconnect(user_id)
    finally:
        db.close()
