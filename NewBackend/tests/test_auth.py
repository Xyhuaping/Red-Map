import pytest
from app.core.security import get_password_hash, verify_password, verify_legacy_password, is_bcrypt_hash
from app.services.auth import AuthService
from app.schemas.auth import UserRegister, UserLogin, PasswordChange
from app.core.exceptions import ConflictException, UnauthorizedException


def test_password_hashing():
    plain = "test_password_123"
    hashed = get_password_hash(plain)
    assert verify_password(plain, hashed) is True
    assert verify_password("wrong_password", hashed) is False


def test_legacy_password_verification():
    import hashlib
    plain = "test_password"
    legacy_hash = hashlib.sha256(plain.encode("utf-8")).hexdigest()
    assert verify_legacy_password(plain, legacy_hash) is True
    assert verify_legacy_password("wrong", legacy_hash) is False


def test_is_bcrypt_hash():
    assert is_bcrypt_hash("$2b$12$abcdef") is True
    assert is_bcrypt_hash("$2a$12$abcdef") is True
    assert is_bcrypt_hash("abc123") is False
    assert is_bcrypt_hash("5e884898da28") is False


def test_register_user(db_session):
    service = AuthService(db_session)
    data = UserRegister(username="newuser", password="password123", nickname="New User")
    result = service.register(data)
    assert result.user.username == "newuser"
    assert result.user.role == "user"
    assert result.access_token is not None
    assert result.refresh_token is not None


def test_register_duplicate_user(db_session):
    service = AuthService(db_session)
    data = UserRegister(username="dup_user", password="password123")
    service.register(data)
    with pytest.raises(ConflictException):
        service.register(UserRegister(username="dup_user", password="password456"))


def test_login_success(db_session):
    service = AuthService(db_session)
    service.register(UserRegister(username="loginuser", password="password123"))

    result = service.login(UserLogin(username="loginuser", password="password123"))
    assert result.access_token is not None
    assert result.user.username == "loginuser"


def test_login_wrong_password(db_session):
    service = AuthService(db_session)
    service.register(UserRegister(username="loginuser2", password="password123"))

    with pytest.raises(UnauthorizedException):
        service.login(UserLogin(username="loginuser2", password="wrongpassword"))


def test_login_nonexistent_user(db_session):
    service = AuthService(db_session)
    with pytest.raises(UnauthorizedException):
        service.login(UserLogin(username="nonexistent", password="password123"))


def test_change_password(db_session):
    service = AuthService(db_session)
    service.register(UserRegister(username="changepwd", password="oldpassword"))

    service.change_password(1, PasswordChange(old_password="oldpassword", new_password="newpassword"))

    result = service.login(UserLogin(username="changepwd", password="newpassword"))
    assert result.access_token is not None
