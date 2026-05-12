from typing import Optional
from sqlalchemy import or_, and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from dao.base import BaseDAO
from models.client_request import ClientRequest


class ClientRequestDAO(BaseDAO[ClientRequest]):
    def __init__(self, session: AsyncSession):
        super().__init__(ClientRequest, session)
    
    async def get_by_status(self, status: str, limit: int = None, offset: int = None) -> list[ClientRequest]:
        return await self.get_all(filters={"status": status}, limit=limit, offset=offset)

    async def get_pending_chat_delete(self) -> list[ClientRequest]:
        from sqlalchemy import select, and_, or_
        query = select(ClientRequest).where(
            and_(
                or_(
                    ClientRequest.chat_deleted.is_(None),
                    ClientRequest.chat_deleted == False
                ),
                ClientRequest.workspace.isnot(None),
                ClientRequest.workspace != "",
                ClientRequest.workspace != "0"
            )
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())