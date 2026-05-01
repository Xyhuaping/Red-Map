from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.models.fence import GeoFence
from app.repositories.base import BaseRepository


class FenceRepository(BaseRepository[GeoFence]):
    def __init__(self, db: Session):
        super().__init__(GeoFence, db)

    def get_active_fences(self, offset: int = 0, limit: int = 100) -> list[GeoFence]:
        return (
            self.db.query(GeoFence)
            .filter(GeoFence.is_active == True)
            .offset(offset)
            .limit(limit)
            .all()
        )

    def check_circle_fences(self, lng: float, lat: float) -> list[GeoFence]:
        sql = text("""
            SELECT *, ST_Distance_Sphere(
                POINT(center_lng, center_lat),
                POINT(:lng, :lat)
            ) AS distance
            FROM geo_fences
            WHERE is_active = TRUE
              AND shape_type = 'circle'
              AND center_lng IS NOT NULL
              AND center_lat IS NOT NULL
              AND radius IS NOT NULL
            HAVING distance <= radius
            ORDER BY distance ASC
        """)
        result = self.db.execute(sql, {"lng": lng, "lat": lat})
        rows = result.fetchall()
        fence_ids = [row[0] for row in rows]
        if not fence_ids:
            return []
        return self.db.query(GeoFence).filter(GeoFence.id.in_(fence_ids)).all()

    def check_polygon_fences(self, lng: float, lat: float) -> list[GeoFence]:
        sql = text("""
            SELECT * FROM geo_fences
            WHERE is_active = TRUE
              AND shape_type = 'polygon'
              AND polygon_coords IS NOT NULL
              AND ST_Contains(
                ST_GeomFromText(polygon_wkt),
                POINT(:lng, :lat)
              )
        """)
        try:
            result = self.db.execute(sql, {"lng": lng, "lat": lat})
            rows = result.fetchall()
            fence_ids = [row[0] for row in rows]
            if not fence_ids:
                return []
            return self.db.query(GeoFence).filter(GeoFence.id.in_(fence_ids)).all()
        except Exception:
            return []

    def get_fences_with_pagination(
        self,
        is_active: Optional[bool] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> list[GeoFence]:
        query = self.db.query(GeoFence)
        if is_active is not None:
            query = query.filter(GeoFence.is_active == is_active)
        return query.order_by(GeoFence.created_at.desc()).offset(offset).limit(limit).all()

    def count_fences(self, is_active: Optional[bool] = None) -> int:
        query = self.db.query(GeoFence)
        if is_active is not None:
            query = query.filter(GeoFence.is_active == is_active)
        return query.count()
