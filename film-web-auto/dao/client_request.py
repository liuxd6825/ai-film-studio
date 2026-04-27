from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from dao.base import BaseDAO
from models.client_request import ClientRequest


class ClientRequestDAO(BaseDAO[ClientRequest]):
    def __init__(self, session: AsyncSession):
        super().__init__(ClientRequest, session)
    
    async def get_by_status(self, status: str, limit: int = None, offset: int = None) -> list[ClientRequest]:
        return await self.get_all(filters={"status": status}, limit=limit, offset=offset)