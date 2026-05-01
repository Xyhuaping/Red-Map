from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.repositories.track import TrackRepository
from app.schemas.tracks import TrackCreate, TrackResponse, TrackStats
from app.schemas.common import PaginatedResponse


class TrackService:
    def __init__(self, db: Session):
        self.db = db
        self.track_repo = TrackRepository(db)

    def get_my_tracks(self, user_id: int, page: int = 1, page_size: int = 20) -> PaginatedResponse:
        offset = (page - 1) * page_size
        tracks = self.track_repo.get_by_user(user_id, offset, page_size)
        total = self.track_repo.count_by_user(user_id)
        items = [TrackResponse.model_validate(t) for t in tracks]
        return PaginatedResponse.create(items=items, total=total, page=page, page_size=page_size)

    def get_my_stats(self, user_id: int) -> TrackStats:
        stats = self.track_repo.get_user_stats(user_id)
        return TrackStats(**stats)

    def record_track(self, user_id: int, data: TrackCreate) -> TrackResponse:
        track = self.track_repo.create({
            "user_id": user_id,
            "fence_id": data.fence_id,
            "figure_id": data.figure_id,
            "interaction_duration": data.interaction_duration,
            "conversation_rounds": data.conversation_rounds,
        })
        return TrackResponse.model_validate(track)
