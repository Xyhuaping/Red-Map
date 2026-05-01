import math
import logging
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.repositories.fence import FenceRepository
from app.repositories.figure import FigureRepository
from app.schemas.fences import (
    GeoFenceCreate, GeoFenceUpdate, GeoFenceResponse,
    FenceCheckRequest, FenceCheckResponse, RedFigureBrief,
)
from app.schemas.common import PaginatedResponse
from app.utils.geo import haversine_distance, is_point_in_polygon

logger = logging.getLogger(__name__)


class FenceService:
    def __init__(self, db: Session):
        self.db = db
        self.fence_repo = FenceRepository(db)
        self.figure_repo = FigureRepository(db)

    def get_fences(self, is_active: bool = None, offset: int = 0, limit: int = 100) -> list[GeoFenceResponse]:
        if is_active is not None:
            fences = self.fence_repo.get_fences_with_pagination(is_active, offset, limit)
        else:
            fences = self.fence_repo.get_fences_with_pagination(None, offset, limit)
        return [self._enrich_fence(f) for f in fences]

    def get_fence(self, fence_id: int) -> GeoFenceResponse:
        fence = self.fence_repo.get_by_id(fence_id)
        if not fence:
            raise NotFoundException("围栏不存在")
        return self._enrich_fence(fence)

    def create_fence(self, data: GeoFenceCreate) -> GeoFenceResponse:
        create_data = data.model_dump()
        if create_data.get("polygon_coords"):
            create_data["polygon_coords"] = [c.model_dump() if hasattr(c, "model_dump") else c for c in create_data["polygon_coords"]]
        fence = self.fence_repo.create(create_data)
        return self._enrich_fence(fence)

    def update_fence(self, fence_id: int, data: GeoFenceUpdate) -> GeoFenceResponse:
        update_data = data.model_dump(exclude_unset=True)
        if update_data.get("polygon_coords"):
            update_data["polygon_coords"] = [c.model_dump() if hasattr(c, "model_dump") else c for c in update_data["polygon_coords"]]
        fence = self.fence_repo.update(fence_id, update_data)
        if not fence:
            raise NotFoundException("围栏不存在")
        return self._enrich_fence(fence)

    def delete_fence(self, fence_id: int) -> bool:
        if not self.fence_repo.delete(fence_id):
            raise NotFoundException("围栏不存在")
        return True

    def toggle_fence_status(self, fence_id: int) -> GeoFenceResponse:
        fence = self.fence_repo.get_by_id(fence_id)
        if not fence:
            raise NotFoundException("围栏不存在")
        fence.is_active = not fence.is_active
        self.db.commit()
        self.db.refresh(fence)
        return self._enrich_fence(fence)

    def check_fence(self, request: FenceCheckRequest) -> FenceCheckResponse:
        try:
            circle_fences = self.fence_repo.check_circle_fences(request.longitude, request.latitude)
            if circle_fences:
                fence = circle_fences[0]
                figure = self._get_figure_brief(fence.figure_id)
                return FenceCheckResponse(
                    triggered=True,
                    fence=self._enrich_fence(fence),
                    figure=figure,
                )
        except Exception:
            logger.debug("Database spatial functions unavailable, falling back to Python calculation")

        active_fences = self.fence_repo.get_active_fences()
        for fence in active_fences:
            if fence.shape_type == "circle" and fence.center_lat and fence.center_lng and fence.radius:
                dist = haversine_distance(
                    request.latitude, request.longitude,
                    float(fence.center_lat), float(fence.center_lng),
                )
                if dist <= float(fence.radius):
                    figure = self._get_figure_brief(fence.figure_id)
                    return FenceCheckResponse(
                        triggered=True,
                        fence=self._enrich_fence(fence),
                        figure=figure,
                    )

            if fence.shape_type == "polygon" and fence.polygon_coords:
                coords = fence.polygon_coords
                if isinstance(coords, str):
                    import json
                    try:
                        coords = json.loads(coords)
                    except (json.JSONDecodeError, TypeError):
                        continue
                if isinstance(coords, list) and len(coords) >= 3:
                    if is_point_in_polygon(request.latitude, request.longitude, coords):
                        figure = self._get_figure_brief(fence.figure_id)
                        return FenceCheckResponse(
                            triggered=True,
                            fence=self._enrich_fence(fence),
                            figure=figure,
                        )

        return FenceCheckResponse(triggered=False)

    def _get_figure_brief(self, figure_id: int) -> RedFigureBrief | None:
        if not figure_id:
            return None
        fig = self.figure_repo.get_by_id(figure_id)
        if fig:
            return RedFigureBrief.model_validate(fig)
        return None

    def _enrich_fence(self, fence) -> GeoFenceResponse:
        resp = GeoFenceResponse.model_validate(fence)
        if fence.figure_id and fence.figure:
            resp.figure = RedFigureBrief.model_validate(fence.figure)
        return resp
