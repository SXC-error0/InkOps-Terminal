"""Mock LLM Provider: 用于 UI 开发与无网络环境"""
import asyncio
import logging
from typing import Type
from pydantic import BaseModel

from app.schemas.quest import QuestPayload

logger = logging.getLogger(__name__)

# 预置模拟数据, 按 Schema 类名索引
_MOCK_DATA: dict[str, dict] = {
    "QuestPayload": {
        "main_quest": "完成墨水屏自动推送接口",
        "side_quests": ["修复留言二维码入口", "完成一次力量训练"],
        "boss_name": "需求膨胀魔王",
        "boss_weakness": "先交付再增加",
        "ban": "今天禁止开新坑",
        "reward": "解锁首支演示视频",
        "declaration": "Build. Ship. Display.",
    },
}


class MockProvider:
    """返回预置结构化数据, 用于开发调试"""

    def __init__(self, delay_seconds: float = 0.3):
        self._delay = delay_seconds

    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        output_schema: Type[BaseModel],
    ) -> BaseModel:
        """模拟延迟后返回预置或自动构造的结构化数据"""
        logger.info("MockProvider: 模拟 LLM 调用 (%.1fs 延迟)", self._delay)
        await asyncio.sleep(self._delay)

        schema_name = output_schema.__name__
        if schema_name in _MOCK_DATA:
            logger.info("MockProvider: 使用预置模拟数据 [%s]", schema_name)
            return output_schema.model_validate(_MOCK_DATA[schema_name])

        # 自动构造: 使用 schema 属性名作为值
        schema = output_schema.model_json_schema()
        props = schema.get("properties", {})
        mock_data: dict = {}
        for key, prop in props.items():
            max_len = prop.get("maxLength", 999)
            raw_value: str = prop.get("default", key)
            match prop.get("type"):
                case "string":
                    mock_data[key] = raw_value[:max_len] if len(raw_value) > max_len else raw_value
                case "array":
                    mock_data[key] = prop.get("default", [])
                case "integer":
                    mock_data[key] = prop.get("default", 0)
                case "boolean":
                    mock_data[key] = prop.get("default", True)
                case _:
                    mock_data[key] = prop.get("default", None)

        for required_key in schema.get("required", []):
            if required_key not in mock_data:
                raw = required_key
                max_len = props.get(required_key, {}).get("maxLength", 999)
                mock_data[required_key] = raw[:max_len]

        return output_schema.model_validate(mock_data)

    async def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        await asyncio.sleep(self._delay)
        return f"[Mock 响应] 你输入了: {user_prompt[:50]}..."

    @staticmethod
    def fill_mock_data(schema: Type[BaseModel], overrides: dict | None = None) -> BaseModel:
        """用硬编码的模拟数据快速生成页面 payload (跳过 LLM 调用)"""
        data = overrides or {}
        return schema.model_validate(data)


_mock_provider: MockProvider | None = None


def get_mock_provider() -> MockProvider:
    global _mock_provider
    if _mock_provider is None:
        _mock_provider = MockProvider()
    return _mock_provider
