import logging
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.repositories.trigger import TriggerRepository
from app.repositories.fence import FenceRepository
from app.repositories.figure import FigureRepository
from app.schemas.triggers import (
    FenceTriggerCreate,
    FenceTriggerResponse,
    ActiveFenceCompact,
    FenceTriggerFenceBrief,
    FenceTriggerFigureBrief,
)
from app.schemas.common import PaginatedResponse

logger = logging.getLogger(__name__)


class TriggerService:
    def __init__(self, db: Session):
        self.db = db
        self.trigger_repo = TriggerRepository(db)
        self.fence_repo = FenceRepository(db)
        self.figure_repo = FigureRepository(db)

    def record_trigger(self, user_id: int, data: FenceTriggerCreate) -> FenceTriggerResponse:
        fence = self.fence_repo.get_by_id(data.fence_id)
        if not fence:
            raise NotFoundException("围栏不存在")

        create_data = data.model_dump()
        create_data["user_id"] = user_id
        trigger = self.trigger_repo.create(create_data)

        resp = FenceTriggerResponse.model_validate(trigger)
        resp.fence = FenceTriggerFenceBrief.model_validate(fence)

        if data.figure_id:
            figure = self.figure_repo.get_by_id(data.figure_id)
            if figure:
                resp.figure = FenceTriggerFigureBrief.model_validate(figure)

        return resp

    def get_trigger_history(
        self, user_id: int, page: int = 1, page_size: int = 20
    ) -> PaginatedResponse:
        offset = (page - 1) * page_size
        triggers = self.trigger_repo.get_by_user_id(user_id, offset, page_size)
        total = self.trigger_repo.count_by_user_id(user_id)

        items = []
        for t in triggers:
            resp = FenceTriggerResponse.model_validate(t)
            if t.fence:
                resp.fence = FenceTriggerFenceBrief.model_validate(t.fence)
            if t.figure:
                resp.figure = FenceTriggerFigureBrief.model_validate(t.figure)
            items.append(resp)

        return PaginatedResponse.create(items, total, page, page_size)

    def get_active_fences_compact(self) -> list[ActiveFenceCompact]:
        fences = self.fence_repo.get_active_fences(limit=200)
        result = []
        for fence in fences:
            compact = ActiveFenceCompact(
                id=fence.id,
                name=fence.name,
                shape_type=fence.shape_type,
                center_lng=float(fence.center_lng) if fence.center_lng else None,
                center_lat=float(fence.center_lat) if fence.center_lat else None,
                radius=fence.radius,
                polygon_coords=fence.polygon_coords if isinstance(fence.polygon_coords, list) else None,
                trigger_prompt=fence.trigger_prompt,
                figure_id=fence.figure_id,
                figure_name=fence.figure.name if fence.figure else None,
                figure_avatar=fence.figure.avatar_url if fence.figure else None,
            )
            result.append(compact)
        return result

    def get_trigger_stats(self, user_id: int = None) -> dict:
        return self.trigger_repo.get_trigger_stats(user_id)
