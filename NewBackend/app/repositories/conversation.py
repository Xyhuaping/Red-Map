from typing import Optional
from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.repositories.base import BaseRepository


class ConversationRepository(BaseRepository[Conversation]):
    def __init__(self, db: Session):
        super().__init__(Conversation, db)

    def get_by_user_and_figure(
        self, user_id: int, figure_id: int, limit: int = 10
    ) -> list[Conversation]:
        return (
            self.db.query(Conversation)
            .filter(Conversation.user_id == user_id, Conversation.figure_id == figure_id)
            .order_by(Conversation.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_history(
        self, user_id: int, figure_id: int
    ) -> list[Conversation]:
        return (
            self.db.query(Conversation)
            .filter(Conversation.user_id == user_id, Conversation.figure_id == figure_id)
            .order_by(Conversation.created_at.asc())
            .all()
        )

    def count_by_user(self, user_id: int) -> int:
        return self.db.query(Conversation).filter(Conversation.user_id == user_id).count()

    def count_all(self) -> int:
        return self.db.query(Conversation).count()

    def get_all_with_pagination(
        self, offset: int = 0, limit: int = 20, figure_id: Optional[int] = None
    ) -> list[Conversation]:
        query = self.db.query(Conversation)
        if figure_id:
            query = query.filter(Conversation.figure_id == figure_id)
        return query.order_by(Conversation.created_at.desc()).offset(offset).limit(limit).all()

    def count_filtered(self, figure_id: Optional[int] = None) -> int:
        query = self.db.query(Conversation)
        if figure_id:
            query = query.filter(Conversation.figure_id == figure_id)
        return query.count()
