from typing import Optional
from sqlalchemy.orm import Session

from app.models.trigger import FenceTrigger
from app.repositories.base import BaseRepository


class TriggerRepository(BaseRepository[FenceTrigger]):
    def __init__(self, db: Session):
        super().__init__(FenceTrigger, db)

    def get_by_user_id(
        self, user_id: int, offset: int = 0, limit: int = 20
    ) -> list[FenceTrigger]:
        return (
            self.db.query(FenceTrigger)
            .filter(FenceTrigger.user_id == user_id)
            .order_by(FenceTrigger.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    def count_by_user_id(self, user_id: int) -> int:
        return (
            self.db.query(FenceTrigger)
            .filter(FenceTrigger.user_id == user_id)
            .count()
        )

    def count_by_fence_id(self, fence_id: int) -> int:
        return (
            self.db.query(FenceTrigger)
            .filter(FenceTrigger.fence_id == fence_id)
            .count()
        )

    def get_recent_by_fence_and_user(
        self, fence_id: int, user_id: int, limit: int = 10
    ) -> list[FenceTrigger]:
        return (
            self.db.query(FenceTrigger)
            .filter(
                FenceTrigger.fence_id == fence_id,
                FenceTrigger.user_id == user_id,
            )
            .order_by(FenceTrigger.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_trigger_stats(self, user_id: Optional[int] = None) -> dict:
        query = self.db.query(FenceTrigger)
        if user_id:
            query = query.filter(FenceTrigger.user_id == user_id)
        total = query.count()

        from sqlalchemy import func
        by_fence = (
            self.db.query(
                FenceTrigger.fence_id,
                func.count(FenceTrigger.id).label("count"),
            )
            .group_by(FenceTrigger.fence_id)
            .order_by(func.count(FenceTrigger.id).desc())
        )
        if user_id:
            by_fence = by_fence.filter(FenceTrigger.user_id == user_id)

        fence_stats = [
            {"fence_id": row.fence_id, "count": row.count}
            for row in by_fence.all()
        ]

        return {"total": total, "by_fence": fence_stats}
