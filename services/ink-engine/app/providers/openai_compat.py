"""OpenAI 兼容协议 LLM Provider 实现"""
import json
import logging
from typing import Type
import httpx
from pydantic import BaseModel
from openai import AsyncOpenAI

from app.config import settings

logger = logging.getLogger(__name__)


class OpenAICompatProvider:
    """兼容 OpenAI 协议的大模型服务"""

    def __init__(self):
        # 跳过系统代理, 避免 SOCKS 协议兼容问题
        http_client = httpx.AsyncClient(proxy=None, trust_env=False)
        self._client = AsyncOpenAI(
            base_url=settings.LLM_BASE_URL,
            api_key=settings.LLM_API_KEY,
            http_client=http_client,
        )

    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        output_schema: Type[BaseModel],
    ) -> BaseModel:
        """生成符合 schema 的结构化输出"""
        schema_json = json.dumps(output_schema.model_json_schema(), ensure_ascii=False)

        full_prompt = (
            f"{system_prompt}\n\n"
            f"你必须返回严格符合以下 JSON Schema 的 JSON, 不要输出任何其他文字:\n"
            f"```json\n{schema_json}\n```"
        )

        response = await self._client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[
                {"role": "system", "content": "你是一个结构化数据输出引擎。只输出合法 JSON。"},
                {"role": "user", "content": full_prompt},
            ],
            temperature=0.7,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content or "{}"
        logger.debug("LLM 原始响应: %s", raw[:200])

        try:
            data = json.loads(raw)
            return output_schema.model_validate(data)
        except (json.JSONDecodeError, ValueError) as e:
            logger.error("LLM 输出解析失败: %s", e)
            raise ValueError(f"大模型返回数据不符合预期格式: {e}") from e

    async def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        """生成自由文本"""
        response = await self._client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
        )
        return response.choices[0].message.content or ""


# 单例
_openai_provider: OpenAICompatProvider | None = None


def get_openai_provider() -> OpenAICompatProvider:
    global _openai_provider
    if _openai_provider is None:
        _openai_provider = OpenAICompatProvider()
    return _openai_provider
