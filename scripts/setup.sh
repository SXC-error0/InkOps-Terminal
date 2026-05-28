#!/bin/bash
# InkOps Terminal 一键环境搭建
set -e

echo "========================================"
echo " InkOps Terminal - 环境搭建"
echo "========================================"

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# 1. Python 后端
echo ""
echo "[1/3] 安装 Python 依赖..."
cd "$PROJECT_DIR/services/ink-engine"
pip install -r requirements.txt -q
echo "  Python 依赖安装完成"

# 2. 配置检查
echo ""
echo "[2/3] 检查配置..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "  已创建 .env, 请编辑填入 LLM_API_KEY"
else
    echo "  .env 已存在"
fi

# 3. 前端
echo ""
echo "[3/3] 安装前端依赖..."
cd "$PROJECT_DIR/apps/desktop"
if command -v pnpm &> /dev/null; then
    pnpm install --silent
    echo "  前端依赖安装完成 (pnpm)"
elif command -v npm &> /dev/null; then
    npm install --silent
    echo "  前端依赖安装完成 (npm)"
else
    echo "  请安装 pnpm 或 npm 后手动执行: cd apps/desktop && pnpm install"
fi

echo ""
echo "========================================"
echo " 搭建完成!"
echo ""
echo " 启动后端: cd services/ink-engine && python3 -m uvicorn app.main:app --port 8700"
echo " 启动前端: cd apps/desktop && npx vite --port 5173"
echo " 演示数据: cd services/ink-engine && python3 ../../scripts/demo_seed.py"
echo "========================================"
