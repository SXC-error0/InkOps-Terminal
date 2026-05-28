"""设备模型"""
import uuid
from datetime import datetime
from sqlmodel import SQLModel, Field


class Device(SQLModel, table=True):
    __tablename__ = "devices"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str = Field(default="NODE-01")
    ip: str | None = None
    model: str = Field(default="4.2inch-e-paper")
    firmware_version: str | None = None
    last_seen: datetime | None = None
    status: str = Field(default="offline")
    created_at: datetime = Field(default_factory=datetime.utcnow)
