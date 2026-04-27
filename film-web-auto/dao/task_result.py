from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from dao.base import BaseDAO
from models.task_result import TaskResult


class TaskResultDAO(BaseDAO[TaskResult]):
    def __init__(self, session: AsyncSession):
        super().__init__(TaskResult, session)
    
    async def get_by_task_id(self, task_id: str) -> list[TaskResult]:
        return await self.get_all(filters={"task_id": task_id})
    
    async def delete_by_task_id(self, task_id: str) -> int:
        return await self.delete_by({"task_id": task_id})
