from typing import Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session):
        super().__init__(User, db)

    def get_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username).first()

    def update_last_login(self, user_id: int) -> None:
        user = self.get_by_id(user_id)
        if user:
            user.last_login_at = datetime.now(timezone.utc)
            self.db.commit()

    def update_password(self, user_id: int, password_hash: str) -> None:
        user = self.get_by_id(user_id)
        if user:
            user.password_hash = password_hash
            self.db.commit()

    def update_role(self, user_id: int, role: str) -> Optional[User]:
        return self.update(user_id, {"role": role})

    def update_status(self, user_id: int, is_active: bool) -> Optional[User]:
        return self.update(user_id, {"is_active": is_active})

    def get_active_users_count(self) -> int:
        return self.db.query(User).filter(User.is_active == True).count()

    def get_users_with_pagination(self, offset: int = 0, limit: int = 20) -> list[User]:
        return self.db.query(User).order_by(User.created_at.desc()).offset(offset).limit(limit).all()
