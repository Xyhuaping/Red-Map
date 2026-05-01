from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.limiter import limiter
from app.models.user import User
from app.services.chat import ChatService
from app.schemas.chat import ChatMessage, ChatResponse, ChatStartResponse, ChatHistoryItem
from app.schemas.common import ResponseBase

router = APIRouter()


@router.post("/start", response_model=ResponseBase[ChatStartResponse])
def start_conversation(
    figure_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ChatService(db)
    result = service.start_conversation(current_user.id, figure_id)
    return ResponseBase(data=result)


@router.post("/send", response_model=ResponseBase[ChatResponse])
@limiter.limit("30/minute")
def send_message(
    request,
    data: ChatMessage,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ChatService(db)
    result = service.send_message(current_user.id, data)
    return ResponseBase(data=result)


@router.get("/history/{figure_id}", response_model=ResponseBase[list[ChatHistoryItem]])
def get_history(
    figure_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ChatService(db)
    history = service.get_history(current_user.id, figure_id)
    return ResponseBase(data=history)
