"""设备管理 API"""
import logging
from fastapi import APIRouter, HTTPException
from sqlmodel import Session, select

from app.models.database import engine
from app.models.device import Device

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("")
async def get_devices() -> list[dict]:
    """获取所有设备"""
    with Session(engine) as session:
        devices = session.exec(select(Device)).all()
    return [d.model_dump() for d in devices]


@router.post("")
async def bind_device(data: dict) -> dict:
    """绑定新设备"""
    name = data.get("name", "NODE-01")
    ip = data.get("ip", "")
    with Session(engine) as session:
        device = Device(name=name, ip=ip, status="online")
        session.add(device)
        session.commit()
        session.refresh(device)
        return device.model_dump()
