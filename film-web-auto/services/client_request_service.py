from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from dao.client_request import ClientRequestDAO
from models.client_request import ClientRequest


class ClientRequestService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.client_request_dao = ClientRequestDAO(session)
    
    async def create_client_request(self, request_data: dict) -> ClientRequest:
        return await self.client_request_dao.create(request_data)
    
    async def get_client_request(self, request_id: str) -> Optional[ClientRequest]:
        return await self.client_request_dao.get_by_id(request_id)
    
    async def update_client_request(self, request_id: str, request_data: dict) -> Optional[ClientRequest]:
        return await self.client_request_dao.update(request_id, request_data)