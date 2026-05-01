from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.exceptions import NotFoundException
from app.models.user import User
from app.models.figure import RedFigure
from app.models.fence import GeoFence
from app.models.track import UserTrack
from app.models.conversation import Conversation
from app.models.system_config import SystemConfig
from app.models.admin_log import AdminLog
from app.repositories.user import UserRepository
from app.repositories.track import TrackRepository
from app.repositories.conversation import ConversationRepository
from app.schemas.admin import (
    DashboardData, AdminUserResponse, AdminConversationResponse,
    SystemConfigResponse, SystemConfigUpdate, AdminLogResponse, GlobalStats,
)
from app.schemas.common import PaginatedResponse


class AdminService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.track_repo = TrackRepository(db)
        self.conv_repo = ConversationRepository(db)

    def get_dashboard(self) -> DashboardData:
        today = date.today()
        return DashboardData(
            total_users=self.db.query(User).count(),
            total_figures=self.db.query(RedFigure).count(),
            total_fences=self.db.query(GeoFence).count(),
            total_conversations=self.db.query(Conversation).count(),
            total_tracks=self.db.query(UserTrack).count(),
            active_users_today=self.db.query(User).filter(
                func.date(User.last_login_at) == today
            ).count(),
            conversations_today=self.db.query(Conversation).filter(
                func.date(Conversation.created_at) == today
            ).count(),
        )

    def get_users(self, page: int = 1, page_size: int = 20) -> PaginatedResponse:
        offset = (page - 1) * page_size
        users = self.user_repo.get_users_with_pagination(offset, page_size)
        total = self.db.query(User).count()
        items = [AdminUserResponse.model_validate(u) for u in users]
        return PaginatedResponse.create(items=items, total=total, page=page, page_size=page_size)

    def update_user_role(self, user_id: int, role: str) -> AdminUserResponse:
        user = self.user_repo.update_role(user_id, role)
        if not user:
            raise NotFoundException("用户不存在")
        return AdminUserResponse.model_validate(user)

    def update_user_status(self, user_id: int, is_active: bool) -> AdminUserResponse:
        user = self.user_repo.update_status(user_id, is_active)
        if not user:
            raise NotFoundException("用户不存在")
        return AdminUserResponse.model_validate(user)

    def get_all_tracks(self, page: int = 1, page_size: int = 20) -> PaginatedResponse:
        offset = (page - 1) * page_size
        tracks = self.track_repo.get_all_tracks_with_pagination(offset, page_size)
        total = self.track_repo.count_all()
        items = []
        for t in tracks:
            item = {
                "id": t.id,
                "user_id": t.user_id,
                "fence_id": t.fence_id,
                "figure_id": t.figure_id,
                "triggered_at": t.triggered_at,
                "interaction_duration": t.interaction_duration,
                "conversation_rounds": t.conversation_rounds,
                "username": t.user.username if t.user else None,
            }
            items.append(item)
        return PaginatedResponse.create(items=items, total=total, page=page, page_size=page_size)

    def get_global_stats(self) -> GlobalStats:
        today = date.today()
        total_users = self.db.query(User).count()
        total_figures = self.db.query(RedFigure).count()
        total_fences = self.db.query(GeoFence).count()
        total_tracks = self.db.query(UserTrack).count()
        total_conversations = self.db.query(Conversation).count()

        active_users_today = self.db.query(User).filter(
            func.date(User.last_login_at) == today
        ).count()

        from datetime import timedelta
        week_start = today - timedelta(days=today.weekday())
        active_users_week = self.db.query(User).filter(
            User.last_login_at >= week_start
        ).count()

        conversations_today = self.db.query(Conversation).filter(
            func.date(Conversation.created_at) == today
        ).count()

        tracks_today = self.db.query(UserTrack).filter(
            func.date(UserTrack.triggered_at) == today
        ).count()

        return GlobalStats(
            total_users=total_users,
            total_figures=total_figures,
            total_fences=total_fences,
            total_tracks=total_tracks,
            total_conversations=total_conversations,
            active_users_today=active_users_today,
            active_users_week=active_users_week,
            conversations_today=conversations_today,
            tracks_today=tracks_today,
        )

    def get_conversations(self, page: int = 1, page_size: int = 20, figure_id: int = None) -> PaginatedResponse:
        offset = (page - 1) * page_size
        conversations = self.conv_repo.get_all_with_pagination(offset, page_size, figure_id)
        total = self.conv_repo.count_filtered(figure_id)
        items = []
        for c in conversations:
            item = {
                "id": c.id,
                "user_id": c.user_id,
                "figure_id": c.figure_id,
                "role": c.role,
                "content": c.content,
                "created_at": c.created_at,
                "username": c.user.username if c.user else None,
                "figure_name": c.figure.name if c.figure else None,
            }
            items.append(item)
        return PaginatedResponse.create(items=items, total=total, page=page, page_size=page_size)

    def get_config(self, key: str) -> SystemConfigResponse:
        config = self.db.query(SystemConfig).filter(SystemConfig.config_key == key).first()
        if not config:
            raise NotFoundException("配置项不存在")
        return SystemConfigResponse.model_validate(config)

    def get_all_configs(self) -> list[SystemConfigResponse]:
        configs = self.db.query(SystemConfig).all()
        return [SystemConfigResponse.model_validate(c) for c in configs]

    def update_config(self, key: str, data: SystemConfigUpdate) -> SystemConfigResponse:
        config = self.db.query(SystemConfig).filter(SystemConfig.config_key == key).first()
        if not config:
            config = SystemConfig(config_key=key, config_value=data.config_value)
            self.db.add(config)
        else:
            config.config_value = data.config_value
        self.db.commit()
        self.db.refresh(config)
        return SystemConfigResponse.model_validate(config)

    def get_logs(self, page: int = 1, page_size: int = 20) -> PaginatedResponse:
        offset = (page - 1) * page_size
        logs = self.db.query(AdminLog).order_by(AdminLog.created_at.desc()).offset(offset).limit(page_size).all()
        total = self.db.query(AdminLog).count()
        items = []
        for log in logs:
            item = {
                "id": log.id,
                "user_id": log.user_id,
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "detail": log.detail,
                "ip_address": log.ip_address,
                "created_at": log.created_at,
                "username": None,
            }
            user = self.user_repo.get_by_id(log.user_id)
            if user:
                item["username"] = user.username
            items.append(item)
        return PaginatedResponse.create(items=items, total=total, page=page, page_size=page_size)

    def log_action(self, user_id: int, action: str, resource_type: str = None,
                   resource_id: int = None, detail: dict = None, ip_address: str = None):
        log = AdminLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            detail=detail,
            ip_address=ip_address,
        )
        self.db.add(log)
        self.db.commit()
