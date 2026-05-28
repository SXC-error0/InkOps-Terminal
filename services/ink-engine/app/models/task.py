"""任务模型 (Quest 模块)"""
import uuid
from datetime import datetime
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON


class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    date: str  # 日期 YYYY-MM-DD
    raw_text: str  # 用户原始输入
    persona: str = Field(default="guild")  # commander / guild / instructor / pet
    quest_payload: dict | None = Field(default=None, sa_column=Column(JSON))  # AI 生成的结构化任务
    completion: str | None = None  # completed / partial / missed
    settled_at: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
