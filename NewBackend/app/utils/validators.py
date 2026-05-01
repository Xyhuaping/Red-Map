import re
from typing import Optional


def validate_longitude(value: float) -> bool:
    return -180 <= value <= 180


def validate_latitude(value: float) -> bool:
    return -90 <= value <= 90


def validate_username(username: str) -> Optional[str]:
    if len(username) < 3:
        return "用户名长度至少3个字符"
    if len(username) > 50:
        return "用户名长度不能超过50个字符"
    if not re.match(r'^[a-zA-Z0-9_\u4e00-\u9fff]+$', username):
        return "用户名只能包含字母、数字、下划线和中文"
    return None


def validate_password_strength(password: str) -> Optional[str]:
    if len(password) < 6:
        return "密码长度至少6个字符"
    if len(password) > 72:
        return "密码长度不能超过72个字符"
    return None


def validate_polygon_coords(coords: list[dict]) -> Optional[str]:
    if not coords or len(coords) < 3:
        return "多边形至少需要3个顶点"
    for i, coord in enumerate(coords):
        if "lng" not in coord or "lat" not in coord:
            return f"第{i+1}个坐标缺少lng或lat字段"
        if not validate_longitude(coord["lng"]):
            return f"第{i+1}个坐标经度无效"
        if not validate_latitude(coord["lat"]):
            return f"第{i+1}个坐标纬度无效"
    return None
