"""数据库引擎与会话管理"""

from sqlmodel import SQLModel, Session, create_engine
from app.config import settings

# SQLite 引擎, 多线程访问配置
engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)


def init_db():
    """创建所有表 (首次启动时调用)"""
    SQLModel.metadata.create_all(engine)


def get_session():
    """获取数据库会话"""
    with Session(engine) as session:
        yield session
