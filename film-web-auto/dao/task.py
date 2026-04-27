from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from dao.base import BaseDAO
from models.task import Task


class TaskDAO(BaseDAO[Task]):
    def __init__(self, session: AsyncSession):
        super().__init__(Task, session)
    
    async def get_by_data_id(self, data_id: str) -> Optional[Task]:
        return await self.get_one({"data_id": data_id})
    
    async def get_by_status(self, status: str, limit: int = None, offset: int = None) -> list[Task]:
        return await self.get_all(filters={"status": status}, limit=limit, offset=offset)
    
    async def get_by_project_id(self, project_id: str) -> list[Task]:
        return await self.get_all(filters={"project_id": project_id})
    
    async def update_status(self, id: str, status: str, desc: str = None) -> Optional[Task]:
        data = {"status": status}
        if desc is not None:
            data["desc"] = desc
        return await self.update(id, data)
