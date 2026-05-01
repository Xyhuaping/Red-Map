from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.user import User
from app.services.fences import FenceService
from app.schemas.fences import (
    GeoFenceCreate, GeoFenceUpdate, GeoFenceResponse,
    FenceCheckRequest, FenceCheckResponse,
)
from app.schemas.common import ResponseBase

router = APIRouter()


@router.get("", response_model=ResponseBase[list[GeoFenceResponse]])
def get_fences(
    is_active: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
):
    service = FenceService(db)
    fences = service.get_fences(is_active, skip, limit)
    return ResponseBase(data=fences)


@router.get("/{fence_id}", response_model=ResponseBase[GeoFenceResponse])
def get_fence(fence_id: int, db: Session = Depends(get_db)):
    service = FenceService(db)
    fence = service.get_fence(fence_id)
    return ResponseBase(data=fence)


@router.post("", response_model=ResponseBase[GeoFenceResponse], status_code=201)
def create_fence(
    data: GeoFenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = FenceService(db)
    fence = service.create_fence(data)
    return ResponseBase(data=fence, message="创建成功")


@router.put("/{fence_id}", response_model=ResponseBase[GeoFenceResponse])
def update_fence(
    fence_id: int,
    data: GeoFenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = FenceService(db)
    fence = service.update_fence(fence_id, data)
    return ResponseBase(data=fence, message="更新成功")


@router.delete("/{fence_id}", response_model=ResponseBase)
def delete_fence(
    fence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = FenceService(db)
    service.delete_fence(fence_id)
    return ResponseBase(message="删除成功")


@router.post("/check", response_model=ResponseBase[FenceCheckResponse])
def check_fence(request: FenceCheckRequest, db: Session = Depends(get_db)):
    service = FenceService(db)
    result = service.check_fence(request)
    return ResponseBase(data=result)


@router.patch("/{fence_id}/status", response_model=ResponseBase[GeoFenceResponse])
def toggle_fence_status(
    fence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = FenceService(db)
    fence = service.toggle_fence_status(fence_id)
    return ResponseBase(data=fence, message="状态切换成功")
