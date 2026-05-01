from fastapi import HTTPException, status
from typing import Any, Optional


class AppException(HTTPException):
    def __init__(
        self,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        message: str = "请求错误",
        detail: Any = None,
    ):
        self.message = message
        self.detail = detail
        super().__init__(status_code=status_code, detail=message)


class UnauthorizedException(AppException):
    def __init__(self, message: str = "未认证或认证已过期"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, message=message)


class ForbiddenException(AppException):
    def __init__(self, message: str = "权限不足"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, message=message)


class NotFoundException(AppException):
    def __init__(self, message: str = "资源不存在"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, message=message)


class ConflictException(AppException):
    def __init__(self, message: str = "资源冲突"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, message=message)


class ValidationException(AppException):
    def __init__(self, message: str = "参数验证失败", detail: Any = None):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, message=message, detail=detail)


class RateLimitException(AppException):
    def __init__(self, message: str = "请求过于频繁，请稍后再试"):
        super().__init__(status_code=status.HTTP_429_TOO_MANY_REQUESTS, message=message)
