#!/bin/bash
set -e

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VENV_DIR="$APP_DIR/.venv"

echo "=== 红色文化AR教育平台 - 部署脚本 ==="
echo "应用目录: $APP_DIR"

echo ""
echo "[1/6] 检查Python环境..."
if [ ! -d "$VENV_DIR" ]; then
    echo "创建虚拟环境..."
    python3 -m venv "$VENV_DIR"
fi
source "$VENV_DIR/bin/activate"

echo ""
echo "[2/6] 安装依赖..."
pip install -r "$APP_DIR/requirements.txt" -q

echo ""
echo "[3/6] 检查环境变量..."
if [ ! -f "$APP_DIR/.env" ]; then
    echo "警告: .env 文件不存在，从 .env.example 复制..."
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
    echo "请编辑 .env 文件配置正确的参数后重新运行部署脚本"
    exit 1
fi

echo ""
echo "[4/6] 创建必要目录..."
mkdir -p "$APP_DIR/media/images"
mkdir -p "$APP_DIR/media/audio"
mkdir -p "$APP_DIR/media/models"
mkdir -p "$APP_DIR/logs"

echo ""
echo "[5/6] 初始化数据库..."
cd "$APP_DIR"
python scripts/init_db.py
python scripts/seed_data.py

echo ""
echo "[6/6] 数据库迁移..."
alembic upgrade head 2>/dev/null || echo "Alembic迁移跳过（首次部署可能不需要）"

echo ""
echo "=== 部署完成 ==="
echo "启动开发服务器: cd $APP_DIR && source .venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo "API文档: http://localhost:8000/docs"
