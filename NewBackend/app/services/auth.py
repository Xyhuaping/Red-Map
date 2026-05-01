from sqlalchemy.orm import Session

from app.core.security import (
    verify_password,
    get_password_hash,
    verify_legacy_password,
    is_bcrypt_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.exceptions import ConflictException, UnauthorizedException, NotFoundException
from app.repositories.user import UserRepository
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, UserResponse, PasswordChange


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def register(self, data: UserRegister) -> TokenResponse:
        existing = self.user_repo.get_by_username(data.username)
        if existing:
            raise ConflictException("用户名已存在")

        password_hash = get_password_hash(data.password)
        user = self.user_repo.create({
            "username": data.username,
            "password_hash": password_hash,
            "nickname": data.nickname or data.username,
        })

        access_token = create_access_token({"sub": user.username, "role": user.role})
        refresh_token = create_refresh_token({"sub": user.username})

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user),
        )

    def login(self, data: UserLogin) -> TokenResponse:
        user = self.user_repo.get_by_username(data.username)
        if not user:
            raise UnauthorizedException("用户名或密码错误")

        if not user.is_active:
            raise UnauthorizedException("账号已被禁用")

        if is_bcrypt_hash(user.password_hash):
            if not verify_password(data.password, user.password_hash):
                raise UnauthorizedException("用户名或密码错误")
        else:
            if not verify_legacy_password(data.password, user.password_hash):
                raise UnauthorizedException("用户名或密码错误")
            user.password_hash = get_password_hash(data.password)
            self.db.commit()

        self.user_repo.update_last_login(user.id)

        access_token = create_access_token({"sub": user.username, "role": user.role})
        refresh_token = create_refresh_token({"sub": user.username})

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user),
        )

    def refresh_token(self, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise UnauthorizedException("无效的刷新令牌")

        username = payload.get("sub")
        user = self.user_repo.get_by_username(username)
        if not user or not user.is_active:
            raise UnauthorizedException("用户不存在或已被禁用")

        access_token = create_access_token({"sub": user.username, "role": user.role})
        new_refresh_token = create_refresh_token({"sub": user.username})

        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            user=UserResponse.model_validate(user),
        )

    def change_password(self, user_id: int, data: PasswordChange) -> bool:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("用户不存在")

        if is_bcrypt_hash(user.password_hash):
            if not verify_password(data.old_password, user.password_hash):
                raise UnauthorizedException("原密码错误")
        else:
            if not verify_legacy_password(data.old_password, user.password_hash):
                raise UnauthorizedException("原密码错误")

        self.user_repo.update_password(user_id, get_password_hash(data.new_password))
        return True

    def get_current_user_info(self, user_id: int) -> UserResponse:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("用户不存在")
        return UserResponse.model_validate(user)
