"""告警记录模型"""
import uuid
from datetime import datetime
from sqlmodel import SQLModel, Field


class Incident(SQLModel, table=True):
    __tablename__ = "incidents"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    monitor_id: str = Field(foreign_key="monitors.id")
    level: str = Field(default="P1")
    summary: str
    ai_diagnosis: str | None = None
    first_action: str | None = None
    opened_at: datetime = Field(default_factory=datetime.utcnow)
    recovered_at: datetime | None = None
