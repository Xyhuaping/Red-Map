import pytest
from app.services.figures import FigureService
from app.schemas.figures import RedFigureCreate, RedFigureUpdate, FigureSearchParams


def test_create_figure(db_session):
    service = FigureService(db_session)
    data = RedFigureCreate(
        name="测试人物",
        title="测试标题",
        category="figure",
        brief_intro="测试简介",
    )
    result = service.create_figure(data)
    assert result.name == "测试人物"
    assert result.category == "figure"


def test_get_figure(db_session):
    service = FigureService(db_session)
    data = RedFigureCreate(name="获取人物", title="标题")
    created = service.create_figure(data)

    result = service.get_figure(created.id)
    assert result.name == "获取人物"


def test_update_figure(db_session):
    service = FigureService(db_session)
    data = RedFigureCreate(name="更新前", title="标题")
    created = service.create_figure(data)

    update_data = RedFigureUpdate(name="更新后")
    result = service.update_figure(created.id, update_data)
    assert result.name == "更新后"


def test_delete_figure(db_session):
    service = FigureService(db_session)
    data = RedFigureCreate(name="删除人物", title="标题")
    created = service.create_figure(data)

    result = service.delete_figure(created.id)
    assert result is True

    from app.core.exceptions import NotFoundException
    with pytest.raises(NotFoundException):
        service.get_figure(created.id)


def test_search_figures(db_session):
    service = FigureService(db_session)
    service.create_figure(RedFigureCreate(name="范长江", category="figure"))
    service.create_figure(RedFigureCreate(name="赵一曼", category="figure"))

    params = FigureSearchParams(keyword="范", page=1, page_size=10)
    result = service.search_figures(params)
    assert result.data is not None
    assert result.data["total"] >= 1
