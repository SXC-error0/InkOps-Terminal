"""显示日志模型"""
from datetime import datetime
from sqlmodel import SQLModel, Field


class DisplayLog(SQLModel, table=True):
    __tablename__ = "display_logs"

    id: int | None = Field(default=None, primary_key=True)
    page_id: str = Field(foreign_key="pages.id")
    device_id: str = Field(foreign_key="devices.id")
    pushed_at: datetime = Field(default_factory=datetime.utcnow)
    result: str | None = None  # success / device_unreachable / timeout
    error_message: str | None = None
