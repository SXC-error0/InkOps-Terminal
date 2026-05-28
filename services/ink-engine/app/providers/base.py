"""LLM Provider 抽象接口"""
from typing import Protocol, Type
from pydantic import BaseModel


class LLMProvider(Protocol):
    """大模型抽象协议, 支持替换不同 Provider"""

    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        output_schema: Type[BaseModel],
    ) -> BaseModel:
        """调用大模型并返回经过 schema 校验的结构化输出"""
        ...

    async def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        """调用大模型返回自由文本"""
        ...
