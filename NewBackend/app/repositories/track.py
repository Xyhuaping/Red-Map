from typing import Optional
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.track import UserTrack
from app.repositories.base import BaseRepository


class TrackRepository(BaseRepository[UserTrack]):
    def __init__(self, db: Session):
        super().__init__(UserTrack, db)

    def get_by_user(self, user_id: int, offset: int = 0, limit: int = 20) -> list[UserTrack]:
        return (
            self.db.query(UserTrack)
            .filter(UserTrack.user_id == user_id)
            .order_by(UserTrack.triggered_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    def count_by_user(self, user_id: int) -> int:
        return self.db.query(UserTrack).filter(UserTrack.user_id == user_id).count()

    def get_user_stats(self, user_id: int) -> dict:
        tracks = self.db.query(UserTrack).filter(UserTrack.user_id == user_id).all()
        total_visits = len(tracks)
        unique_figures = len(set(t.figure_id for t in tracks if t.figure_id))
        total_duration = sum(t.interaction_duration or 0 for t in tracks)
        total_rounds = sum(t.conversation_rounds or 0 for t in tracks)

        today = date.today()
        today_visits = len([t for t in tracks if t.triggered_at and t.triggered_at.date() == today])

        week_start = today - datetime.timedelta(days=today.weekday())
        week_visits = len([t for t in tracks if t.triggered_at and t.triggered_at.date() >= week_start])

        return {
            "total_visits": total_visits,
            "unique_figures": unique_figures,
            "total_duration": total_duration,
            "total_rounds": total_rounds,
            "today_visits": today_visits,
            "week_visits": week_visits,
        }

    def get_all_tracks_with_pagination(self, offset: int = 0, limit: int = 20) -> list[UserTrack]:
        return (
            self.db.query(UserTrack)
            .order_by(UserTrack.triggered_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    def count_all(self) -> int:
        return self.db.query(UserTrack).count()

    def get_global_stats(self) -> dict:
        total_tracks = self.db.query(UserTrack).count()
        total_conversation_rounds = self.db.query(
            func.sum(UserTrack.conversation_rounds)
        ).scalar() or 0
        total_duration = self.db.query(
            func.sum(UserTrack.interaction_duration)
        ).scalar() or 0

        today = date.today()
        tracks_today = self.db.query(UserTrack).filter(
            func.date(UserTrack.triggered_at) == today
        ).count()

        return {
            "total_tracks": total_tracks,
            "total_conversation_rounds": int(total_conversation_rounds),
            "total_duration": int(total_duration),
            "tracks_today": tracks_today,
        }
