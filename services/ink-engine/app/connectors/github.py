"""GitHub API 连接器"""
import logging
from app.config import settings

logger = logging.getLogger(__name__)


async def get_today_commits() -> dict:
    """获取今日 GitHub 提交摘要"""
    username = settings.GITHUB_USERNAME
    token = settings.GITHUB_TOKEN

    if not username:
        return {"count": 0, "recent": [], "streak": 0}

    try:
        import httpx
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        async with httpx.AsyncClient(timeout=10) as client:
            # 获取最近事件
            resp = await client.get(
                f"https://api.github.com/users/{username}/events?per_page=30",
                headers=headers,
            )
            if resp.status_code != 200:
                logger.warning("GitHub API 返回 %d: %s", resp.status_code, resp.text[:100])
                return {"count": 0, "recent": [], "streak": 0}

            events = resp.json()
            pushes = [e for e in events if e.get("type") == "PushEvent"]
            today_commits = 0
            recent_messages: list[str] = []
            from datetime import datetime

            for push in pushes[:5]:
                for commit in push.get("payload", {}).get("commits", []):
                    today_commits += 1
                    msg = commit.get("message", "").split("\n")[0][:50]
                    recent_messages.append(msg)

            return {
                "count": today_commits,
                "recent": recent_messages[:5],
                "streak": min(len(pushes), 7),  # 简化的 streak
            }
    except Exception as e:
        logger.error("GitHub 请求异常: %s", e)
        return {"count": 0, "recent": [], "streak": 0}
