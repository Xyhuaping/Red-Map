from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.auth import AuthService
from app.schemas.auth import (
    UserRegister, UserLogin, TokenResponse, UserResponse,
    PasswordChange, TokenRefresh,
)
from app.schemas.common import ResponseBase

router = APIRouter()


@router.post("/register", response_model=ResponseBase[TokenResponse], status_code=201)
def register(data: UserRegister, db: Session = Depends(get_db)):
    service = AuthService(db)
    result = service.register(data)
    return ResponseBase(data=result, message="注册成功")


@router.post("/login", response_model=ResponseBase[TokenResponse])
def login(data: UserLogin, db: Session = Depends(get_db)):
    service = AuthService(db)
    result = service.login(data)
    return ResponseBase(data=result, message="登录成功")


@router.get("/me", response_model=ResponseBase[UserResponse])
def get_me(current_user: User = Depends(get_current_user)):
    return ResponseBase(data=UserResponse.model_validate(current_user))


@router.put("/password", response_model=ResponseBase)
def change_password(
    data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    service.change_password(current_user.id, data)
    return ResponseBase(message="密码修改成功")


@router.post("/refresh", response_model=ResponseBase[TokenResponse])
def refresh_token(data: TokenRefresh, db: Session = Depends(get_db)):
    service = AuthService(db)
    result = service.refresh_token(data.refresh_token)
    return ResponseBase(data=result, message="刷新成功")


@router.post("/logout", response_model=ResponseBase)
def logout(current_user: User = Depends(get_current_user)):
    return ResponseBase(message="退出登录成功")
