"""页面候选与历史模型 (核心表)"""
import uuid
from datetime import datetime
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON


class Page(SQLModel, table=True):
    __tablename__ = "pages"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    type: str  # quest / terminal / launch / alert / postcard / report
    template_id: str  # QUEST_SCROLL / TERMINAL_STATUS / LAUNCH_PANEL / SYSTEM_ALERT / POSTCARD / RELEASE_NEWS
    priority: int = Field(default=2)  # P0=0 ... P5=5
    urgency: str = Field(default="normal")  # critical / important / normal / low
    interruptible: bool = Field(default=True)
    expires_at: datetime | None = None
    display_duration: int | None = None  # 建议显示秒数
    emotion: str | None = None  # warning / reward / calm / fun
    trigger_source: str | None = None  # monitor:xxx / user / scheduled / github
    reason: str | None = None  # AI 推荐理由
    payload: dict = Field(default={}, sa_column=Column(JSON))  # 结构化页面内容
    image_path: str | None = None  # 渲染 PNG 路径
    status: str = Field(default="draft")  # draft / ready / pushed / archived / failed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    pushed_at: datetime | None = None
