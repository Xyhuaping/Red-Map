import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.figure import RedFigure
from app.models.fence import GeoFence
from app.models.system_config import SystemConfig


def seed_data():
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                password_hash=get_password_hash("admin123"),
                nickname="管理员",
                role="admin",
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print(f"Admin user created: {admin_user.username}")
        else:
            print("Admin user already exists")

        test_user = db.query(User).filter(User.username == "testuser").first()
        if not test_user:
            test_user = User(
                username="testuser",
                password_hash=get_password_hash("test123"),
                nickname="测试用户",
                role="user",
                is_active=True,
            )
            db.add(test_user)
            db.commit()
            print("Test user created")
        else:
            print("Test user already exists")

        if db.query(RedFigure).count() == 0:
            figures_data = [
                {
                    "name": "范长江",
                    "title": "杰出的新闻记者",
                    "category": "figure",
                    "birth_year": 1909,
                    "death_year": 1970,
                    "location": "四川内江",
                    "brief_intro": "范长江是中国杰出的新闻记者，新中国新闻事业的奠基人之一。",
                    "full_bio": "范长江（1909-1970），四川内江人，中国杰出的新闻记者、新闻学家。他是新中国新闻事业的奠基人和开拓者之一，曾创建中国青年新闻记者协会，也是新华社的重要创建者之一。",
                    "prompt_template": "你是范长江，一位杰出的新闻记者。你热爱新闻事业，坚持真实报道，关心国家大事。请用温暖而坚定的语气与来访者对话，分享你的新闻理想和人生感悟。",
                    "is_active": True,
                    "sort_order": 100,
                },
                {
                    "name": "赵一曼",
                    "title": "抗日民族英雄",
                    "category": "figure",
                    "birth_year": 1905,
                    "death_year": 1936,
                    "location": "四川宜宾",
                    "brief_intro": "赵一曼是著名的抗日民族英雄，被誉为'白山黑水'民族魂。",
                    "full_bio": "赵一曼（1905-1936），原名李坤泰，四川宜宾人，著名抗日民族英雄。1935年任东北人民革命军第三军第二团政委，在同日寇作战中被捕，1936年8月英勇就义。",
                    "prompt_template": "你是赵一曼，一位坚贞不屈的抗日英雄。你深爱祖国，为了民族解放事业不惜牺牲一切。请用坚毅而深情的语气与来访者对话，讲述你的抗日经历和对祖国的热爱。",
                    "is_active": True,
                    "sort_order": 90,
                },
            ]
            for fig_data in figures_data:
                figure = RedFigure(**fig_data)
                db.add(figure)
            db.commit()
            print(f"Created {len(figures_data)} sample figures")
        else:
            print("Figures already exist")

        if db.query(GeoFence).count() == 0:
            fences_data = [
                {
                    "name": "范长江纪念馆围栏",
                    "shape_type": "circle",
                    "figure_id": 1,
                    "center_lng": 104.065699,
                    "center_lat": 30.580307,
                    "radius": 200,
                    "trigger_prompt": "欢迎来到范长江纪念馆，这里记录着杰出新闻记者范长江的光辉事迹。",
                    "is_active": True,
                    "color": "#D93025",
                },
            ]
            for fence_data in fences_data:
                fence = GeoFence(**fence_data)
                db.add(fence)
            db.commit()
            print(f"Created {len(fences_data)} sample fences")
        else:
            print("Fences already exist")

        default_configs = [
            {"config_key": "zhipu_api_key", "config_value": "", "description": "智谱AI API密钥"},
            {"config_key": "amap_key", "config_value": "", "description": "高德地图Key"},
            {"config_key": "max_chat_per_minute", "config_value": "30", "description": "每分钟对话次数上限"},
            {"config_key": "site_name", "config_value": "红色文化AR教育平台", "description": "站点名称"},
        ]
        for cfg in default_configs:
            existing = db.query(SystemConfig).filter(SystemConfig.config_key == cfg["config_key"]).first()
            if not existing:
                config = SystemConfig(**cfg)
                db.add(config)
        db.commit()
        print("Default configs ensured")

    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
