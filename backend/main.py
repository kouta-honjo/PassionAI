"""
PassionAI - 圃場管理API
FastAPI エントリーポイント
"""

from fastapi import FastAPI

from database import engine, Base
from routers.fields import router as fields_router

app = FastAPI(
    title="PassionAI - 圃場管理API",
    version="1.0.0",
    description="情熱カンパニー向け耕作放棄地の圃場管理システム",
)

# テーブル作成
Base.metadata.create_all(bind=engine)

# ルーター登録
app.include_router(fields_router)
