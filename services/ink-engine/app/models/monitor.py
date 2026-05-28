"""监控配置模型"""
import uuid
from datetime import datetime
from sqlmodel import SQLModel, Field


class Monitor(SQLModel, table=True):
    __tablename__ = "monitors"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    target_type: str  # http / tcp / mqtt / device
    endpoint: str
    interval_seconds: int = Field(default=60)
    timeout_seconds: int = Field(default=10)
    status: str = Field(default="unknown")
    consecutive_failures: int = Field(default=0)
    alert_threshold: int = Field(default=3)
    last_checked_at: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
