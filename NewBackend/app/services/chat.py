from sqlalchemy.orm import Session
from loguru import logger

from app.core.config import settings
from app.core.exceptions import NotFoundException
from app.repositories.conversation import ConversationRepository
from app.repositories.figure import FigureRepository
from app.schemas.chat import (
    ChatMessage, ChatResponse, ChatStartResponse,
    ChatHistoryItem,
)


class ChatService:
    def __init__(self, db: Session):
        self.db = db
        self.conv_repo = ConversationRepository(db)
        self.figure_repo = FigureRepository(db)

    def start_conversation(self, user_id: int, figure_id: int) -> ChatStartResponse:
        figure = self.figure_repo.get_by_id(figure_id)
        if not figure:
            raise NotFoundException("人物不存在")

        initial_message = f"你好！我是{figure.name}。{figure.brief_intro or '很高兴见到你！'}"

        self.conv_repo.create({
            "user_id": user_id,
            "figure_id": figure_id,
            "role": "assistant",
            "content": initial_message,
        })

        return ChatStartResponse(
            figure_id=figure.id,
            figure_name=figure.name,
            initial_message=initial_message,
            audio_url=figure.avatar_url,
        )

    def send_message(self, user_id: int, data: ChatMessage) -> ChatResponse:
        figure = self.figure_repo.get_by_id(data.figure_id)
        if not figure:
            raise NotFoundException("人物不存在")

        self.conv_repo.create({
            "user_id": user_id,
            "figure_id": data.figure_id,
            "role": "user",
            "content": data.message,
        })

        system_prompt = figure.prompt_template or f"你是{figure.name}，{figure.title}。请用温暖的语气与用户对话。"
        messages = [{"role": "system", "content": system_prompt}]

        history = self.conv_repo.get_by_user_and_figure(user_id, data.figure_id, limit=10)
        for msg in reversed(history):
            messages.append({"role": msg.role, "content": msg.content})

        messages.append({"role": "user", "content": data.message})

        ai_response = self._call_glm(messages)

        self.conv_repo.create({
            "user_id": user_id,
            "figure_id": data.figure_id,
            "role": "assistant",
            "content": ai_response,
        })

        return ChatResponse(message=ai_response)

    def get_history(self, user_id: int, figure_id: int) -> list[ChatHistoryItem]:
        history = self.conv_repo.get_history(user_id, figure_id)
        return [ChatHistoryItem.model_validate(h) for h in history]

    def _call_glm(self, messages: list) -> str:
        if not settings.ZHIPU_API_KEY:
            return "抱歉，AI服务暂未配置。请检查后台配置。"

        try:
            from zhipuai import ZhipuAI
            client = ZhipuAI(api_key=settings.ZHIPU_API_KEY)
            response = client.chat.completions.create(
                model="glm-4",
                messages=messages,
                temperature=0.8,
                max_tokens=500,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"GLM API call failed: {e}")
            return f"AI回复失败，请稍后再试。"

    async def stream_glm(self, messages: list):
        if not settings.ZHIPU_API_KEY:
            yield "抱歉，AI服务暂未配置。"
            return

        try:
            from zhipuai import ZhipuAI
            client = ZhipuAI(api_key=settings.ZHIPU_API_KEY)
            response = client.chat.completions.create(
                model="glm-4",
                messages=messages,
                temperature=0.8,
                max_tokens=500,
                stream=True,
            )
            full_text = ""
            for chunk in response:
                delta = chunk.choices[0].delta.content if chunk.choices[0].delta else ""
                if delta:
                    full_text += delta
                    yield delta
        except Exception as e:
            logger.error(f"GLM API stream call failed: {e}")
            yield "AI回复失败，请稍后再试。"
