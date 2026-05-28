"""留言模型"""
import uuid
from datetime import datetime
from sqlmodel import SQLModel, Field


class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    sender_name: str | None = None
    text: str  # 最长 80 字
    safety_status: str = Field(default="pending")  # pending / approved / rejected
    page_id: str | None = Field(default=None, foreign_key="pages.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
