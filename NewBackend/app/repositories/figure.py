from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.figure import RedFigure
from app.repositories.base import BaseRepository


class FigureRepository(BaseRepository[RedFigure]):
    def __init__(self, db: Session):
        super().__init__(RedFigure, db)

    def search(
        self,
        keyword: Optional[str] = None,
        category: Optional[str] = None,
        is_active: Optional[bool] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> list[RedFigure]:
        query = self.db.query(RedFigure)
        if keyword:
            query = query.filter(
                or_(
                    RedFigure.name.contains(keyword),
                    RedFigure.location.contains(keyword),
                    RedFigure.title.contains(keyword),
                )
            )
        if category:
            query = query.filter(RedFigure.category == category)
        if is_active is not None:
            query = query.filter(RedFigure.is_active == is_active)
        return query.order_by(RedFigure.sort_order.desc(), RedFigure.created_at.desc()).offset(offset).limit(limit).all()

    def search_count(
        self,
        keyword: Optional[str] = None,
        category: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> int:
        query = self.db.query(RedFigure)
        if keyword:
            query = query.filter(
                or_(
                    RedFigure.name.contains(keyword),
                    RedFigure.location.contains(keyword),
                    RedFigure.title.contains(keyword),
                )
            )
        if category:
            query = query.filter(RedFigure.category == category)
        if is_active is not None:
            query = query.filter(RedFigure.is_active == is_active)
        return query.count()

    def get_active_figures(self, offset: int = 0, limit: int = 100) -> list[RedFigure]:
        return (
            self.db.query(RedFigure)
            .filter(RedFigure.is_active == True)
            .order_by(RedFigure.sort_order.desc(), RedFigure.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
