from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.triggers import TriggerService
from app.schemas.triggers import FenceTriggerCreate, FenceTriggerResponse
from app.schemas.common import ResponseBase, PaginatedResponse

router = APIRouter()


@router.post("/fences/trigger", response_model=ResponseBase[FenceTriggerResponse], status_code=201)
def record_trigger(
    data: FenceTriggerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = TriggerService(db)
    trigger = service.record_trigger(current_user.id, data)
    return ResponseBase(data=trigger, message="触发记录成功")


@router.get("/triggers/history", response_model=PaginatedResponse)
def get_trigger_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = TriggerService(db)
    result = service.get_trigger_history(current_user.id, page, page_size)
    return result
