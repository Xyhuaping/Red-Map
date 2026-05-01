import pytest
from app.services.fences import FenceService
from app.schemas.fences import GeoFenceCreate, GeoFenceUpdate, FenceCheckRequest
from app.core.exceptions import NotFoundException


def test_create_circle_fence(db_session):
    service = FenceService(db_session)
    data = GeoFenceCreate(
        name="测试圆形围栏",
        shape_type="circle",
        center_lng=104.065699,
        center_lat=30.580307,
        radius=200,
    )
    result = service.create_fence(data)
    assert result.name == "测试圆形围栏"
    assert result.shape_type == "circle"


def test_create_polygon_fence(db_session):
    service = FenceService(db_session)
    data = GeoFenceCreate(
        name="测试多边形围栏",
        shape_type="polygon",
        polygon_coords=[
            {"lng": 104.065, "lat": 30.580},
            {"lng": 104.067, "lat": 30.580},
            {"lng": 104.067, "lat": 30.582},
            {"lng": 104.065, "lat": 30.582},
        ],
    )
    result = service.create_fence(data)
    assert result.name == "测试多边形围栏"
    assert result.shape_type == "polygon"


def test_update_fence(db_session):
    service = FenceService(db_session)
    data = GeoFenceCreate(name="更新前围栏", center_lng=104.0, center_lat=30.0, radius=100)
    created = service.create_fence(data)

    update_data = GeoFenceUpdate(name="更新后围栏")
    result = service.update_fence(created.id, update_data)
    assert result.name == "更新后围栏"


def test_delete_fence(db_session):
    service = FenceService(db_session)
    data = GeoFenceCreate(name="删除围栏", center_lng=104.0, center_lat=30.0, radius=100)
    created = service.create_fence(data)

    result = service.delete_fence(created.id)
    assert result is True

    with pytest.raises(NotFoundException):
        service.get_fence(created.id)


def test_toggle_fence_status(db_session):
    service = FenceService(db_session)
    data = GeoFenceCreate(name="状态围栏", center_lng=104.0, center_lat=30.0, radius=100, is_active=True)
    created = service.create_fence(data)

    result = service.toggle_fence_status(created.id)
    assert result.is_active is False

    result = service.toggle_fence_status(created.id)
    assert result.is_active is True


def test_check_fence_no_trigger(db_session):
    service = FenceService(db_session)
    data = GeoFenceCreate(
        name="远距离围栏",
        center_lng=116.397,
        center_lat=39.908,
        radius=200,
    )
    service.create_fence(data)

    request = FenceCheckRequest(longitude=104.065, latitude=30.580)
    result = service.check_fence(request)
    assert result.triggered is False
