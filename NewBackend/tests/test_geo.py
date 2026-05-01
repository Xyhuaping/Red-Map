import pytest
from app.utils.geo import haversine_distance, is_point_in_polygon, polygon_to_wkt


def test_haversine_distance():
    dist = haversine_distance(30.580307, 104.065699, 30.580407, 104.065799)
    assert 0 < dist < 100

    dist_same = haversine_distance(30.0, 104.0, 30.0, 104.0)
    assert dist_same == 0.0


def test_is_point_in_polygon():
    polygon = [
        {"lng": 104.065, "lat": 30.580},
        {"lng": 104.067, "lat": 30.580},
        {"lng": 104.067, "lat": 30.582},
        {"lng": 104.065, "lat": 30.582},
    ]

    assert is_point_in_polygon(30.581, 104.066, polygon) is True
    assert is_point_in_polygon(30.570, 104.050, polygon) is False


def test_is_point_in_polygon_insufficient_points():
    assert is_point_in_polygon(30.0, 104.0, []) is False
    assert is_point_in_polygon(30.0, 104.0, [{"lng": 104.0, "lat": 30.0}]) is False


def test_polygon_to_wkt():
    coords = [
        {"lng": 104.065, "lat": 30.580},
        {"lng": 104.067, "lat": 30.580},
        {"lng": 104.067, "lat": 30.582},
    ]
    wkt = polygon_to_wkt(coords)
    assert "POLYGON" in wkt
    assert "104.065" in wkt


def test_polygon_to_wkt_empty():
    assert polygon_to_wkt([]) == ""
    assert polygon_to_wkt([{"lng": 1, "lat": 2}]) == ""
