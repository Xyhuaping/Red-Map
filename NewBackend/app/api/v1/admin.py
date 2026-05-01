from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.services.admin import AdminService
from app.schemas.admin import (
    DashboardData, AdminUserResponse, AdminConversationResponse,
    SystemConfigResponse, SystemConfigUpdate, AdminLogResponse, GlobalStats,
)
from app.schemas.auth import AdminUserUpdate
from app.schemas.common import ResponseBase, PaginatedResponse

router = APIRouter()


@router.get("/dashboard", response_model=ResponseBase[DashboardData])
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = AdminService(db)
    data = service.get_dashboard()
    return ResponseBase(data=data)


@router.get("/users", response_model=PaginatedResponse)
def get_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = AdminService(db)
    return service.get_users(page, page_size)


@router.put("/users/{user_id}/role", response_model=ResponseBase[AdminUserResponse])
def update_user_role(
    user_id: int,
    data: AdminUserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = AdminService(db)
    result = service.update_user_role(user_id, data.role)
    service.log_action(
        user_id=current_user.id,
        action="update_role",
        resource_type="user",
        resource_id=user_id,
        detail={"role": data.role},
        ip_address=request.client.host if request.client else None,
    )
    return ResponseBase(data=result, message="角色更新成功")


@router.put("/users/{user_id}/status", response_model=ResponseBase[AdminUserResponse])
def update_user_status(
    user_id: int,
    data: AdminUserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = AdminService(db)
    result = service.update_user_status(user_id, data.is_active)
    service.log_action(
        user_id=current_user.id,
        action="update_status",
        resource_type="user",
        resource_id=user_id,
        detail={"is_active": data.is_active},
        ip_address=request.client.host if request.client else None,
    )
    return ResponseBase(data=result, message="状态更新成功")


@router.get("/tracks", response_model=PaginatedResponse)
def get_all_tracks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = AdminService(db)
    return service.get_all_tracks(page, page_size)


@router.get("/stats", response_model=ResponseBase[GlobalStats])
def get_global_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = AdminService(db)
    data = service.get_global_stats()
    return ResponseBase(data=data)


@router.get("/conversations", response_model=PaginatedResponse)
def get_conversations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    figure_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = AdminService(db)
    return service.get_conversations(page, page_size, figure_id)


@router.get("/config", response_model=ResponseBase[list[SystemConfigResponse]])
def get_configs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = AdminService(db)
    configs = service.get_all_configs()
    return ResponseBase(data=configs)


@router.get("/config/{key}", response_model=ResponseBase[SystemConfigResponse])
def get_config(
    key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = AdminService(db)
    config = service.get_config(key)
    return ResponseBase(data=config)


@router.put("/config/{key}", response_model=ResponseBase[SystemConfigResponse])
def update_config(
    key: str,
    data: SystemConfigUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = AdminService(db)
    config = service.update_config(key, data)
    service.log_action(
        user_id=current_user.id,
        action="update_config",
        resource_type="system_config",
        detail={"key": key},
        ip_address=request.client.host if request.client else None,
    )
    return ResponseBase(data=config, message="配置更新成功")


@router.get("/logs", response_model=PaginatedResponse)
def get_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = AdminService(db)
    return service.get_logs(page, page_size)
