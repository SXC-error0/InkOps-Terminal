"""HTTP 健康检测器"""
import logging
import httpx
from datetime import datetime

logger = logging.getLogger(__name__)


async def check_http(endpoint: str, timeout: int = 10) -> dict:
    """HTTP 端点健康检测"""
    now = datetime.utcnow()  # datetime 对象, 不是字符串
    try:
        # 跳过系统代理, 避免 SOCKS 兼容问题
        async with httpx.AsyncClient(timeout=timeout, proxy=None, trust_env=False) as client:
            resp = await client.get(endpoint, follow_redirects=True)
            return {
                "status": "online" if resp.status_code < 500 else "error",
                "code": resp.status_code,
                "latency_ms": resp.elapsed.total_seconds() * 1000,
                "checked_at": now,
            }
    except httpx.TimeoutException:
        return {"status": "timeout", "code": 0, "latency_ms": 0, "checked_at": now}
    except Exception as e:
        logger.warning("HTTP 检测失败 [%s]: %s", endpoint, e)
        return {"status": "offline", "code": 0, "latency_ms": 0, "checked_at": now}
