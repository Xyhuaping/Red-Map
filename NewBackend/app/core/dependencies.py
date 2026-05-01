from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(token)
    if payload is None:
        raise UnauthorizedException("无效的认证凭据")

    token_type = payload.get("type")
    if token_type != "access":
        raise UnauthorizedException("无效的Token类型")

    username = payload.get("sub")
    if username is None:
        raise UnauthorizedException("无效的认证凭据")

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise UnauthorizedException("用户不存在")

    if not user.is_active:
        raise ForbiddenException("账号已被禁用")

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise ForbiddenException("需要管理员权限")
    return current_user


def get_current_user_optional(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    try:
        return get_current_user(token, db)
    except (UnauthorizedException, ForbiddenException):
        return None
