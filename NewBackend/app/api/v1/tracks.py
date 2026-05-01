from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.tracks import TrackService
from app.schemas.tracks import TrackCreate, TrackResponse, TrackStats
from app.schemas.common import ResponseBase, PaginatedResponse

router = APIRouter()


@router.get("/my", response_model=PaginatedResponse)
def get_my_tracks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = TrackService(db)
    return service.get_my_tracks(current_user.id, page, page_size)


@router.get("/stats", response_model=ResponseBase[TrackStats])
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = TrackService(db)
    stats = service.get_my_stats(current_user.id)
    return ResponseBase(data=stats)


@router.post("/record", response_model=ResponseBase[TrackResponse], status_code=201)
def record_track(
    data: TrackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = TrackService(db)
    track = service.record_track(current_user.id, data)
    return ResponseBase(data=track, message="记录成功")
