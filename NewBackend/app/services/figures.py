from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.repositories.figure import FigureRepository
from app.schemas.figures import RedFigureCreate, RedFigureUpdate, RedFigureResponse, FigureSearchParams
from app.schemas.common import PaginatedResponse


class FigureService:
    def __init__(self, db: Session):
        self.db = db
        self.figure_repo = FigureRepository(db)

    def get_figures(self, offset: int = 0, limit: int = 100) -> list[RedFigureResponse]:
        figures = self.figure_repo.get_active_figures(offset, limit)
        return [RedFigureResponse.model_validate(f) for f in figures]

    def get_figure(self, figure_id: int) -> RedFigureResponse:
        figure = self.figure_repo.get_by_id(figure_id)
        if not figure:
            raise NotFoundException("人物不存在")
        return RedFigureResponse.model_validate(figure)

    def create_figure(self, data: RedFigureCreate) -> RedFigureResponse:
        figure = self.figure_repo.create(data.model_dump())
        return RedFigureResponse.model_validate(figure)

    def update_figure(self, figure_id: int, data: RedFigureUpdate) -> RedFigureResponse:
        update_data = data.model_dump(exclude_unset=True)
        figure = self.figure_repo.update(figure_id, update_data)
        if not figure:
            raise NotFoundException("人物不存在")
        return RedFigureResponse.model_validate(figure)

    def delete_figure(self, figure_id: int) -> bool:
        if not self.figure_repo.delete(figure_id):
            raise NotFoundException("人物不存在")
        return True

    def search_figures(self, params: FigureSearchParams) -> PaginatedResponse:
        figures = self.figure_repo.search(
            keyword=params.keyword,
            category=params.category,
            offset=params.offset,
            limit=params.limit,
        )
        total = self.figure_repo.search_count(
            keyword=params.keyword,
            category=params.category,
        )
        items = [RedFigureResponse.model_validate(f) for f in figures]
        return PaginatedResponse.create(
            items=items, total=total, page=params.page, page_size=params.page_size
        )
