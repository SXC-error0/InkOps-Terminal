"""项目模型 (Launch 模块)"""
import uuid
from datetime import datetime
from sqlmodel import SQLModel, Field


class Project(SQLModel, table=True):
    __tablename__ = "projects"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    goal: str | None = None
    deadline: datetime | None = None
    progress: int = Field(default=0)  # 0-100 百分比
    status: str = Field(default="active")  # active / paused / launched
    created_at: datetime = Field(default_factory=datetime.utcnow)
