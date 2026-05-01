import pytest
from app.utils.validators import (
    validate_longitude, validate_latitude,
    validate_username, validate_password_strength,
    validate_polygon_coords,
)


def test_validate_longitude():
    assert validate_longitude(0) is True
    assert validate_longitude(180) is True
    assert validate_longitude(-180) is True
    assert validate_longitude(181) is False
    assert validate_longitude(-181) is False


def test_validate_latitude():
    assert validate_latitude(0) is True
    assert validate_latitude(90) is True
    assert validate_latitude(-90) is True
    assert validate_latitude(91) is False
    assert validate_latitude(-91) is False


def test_validate_username():
    assert validate_username("abc") is None
    assert validate_username("ab") is not None
    assert validate_username("a" * 51) is not None
    assert validate_username("user_123") is None


def test_validate_password_strength():
    assert validate_password_strength("123456") is None
    assert validate_password_strength("12345") is not None
    assert validate_password_strength("a" * 73) is not None


def test_validate_polygon_coords():
    valid_coords = [
        {"lng": 104.0, "lat": 30.0},
        {"lng": 105.0, "lat": 30.0},
        {"lng": 105.0, "lat": 31.0},
    ]
    assert validate_polygon_coords(valid_coords) is None

    assert validate_polygon_coords([]) is not None
    assert validate_polygon_coords([{"lng": 1, "lat": 2}]) is not None

    invalid_coords = [
        {"lng": 200, "lat": 30.0},
        {"lng": 105.0, "lat": 30.0},
        {"lng": 105.0, "lat": 31.0},
    ]
    assert validate_polygon_coords(invalid_coords) is not None
