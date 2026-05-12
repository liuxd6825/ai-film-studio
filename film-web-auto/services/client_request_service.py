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
    
    async def get_pending_chat_delete(self, reserved_quantity: int = None, reserved_time_length: int = None) -> list[ClientRequest]:
        from datetime import datetime, timedelta, timezone
        
        all_pending = await self.client_request_dao.get_pending_chat_delete()
        
        if not all_pending:
            return []
        
        all_pending_sorted = sorted(all_pending, key=lambda x: x.created_at or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
        
        remaining_by_quantity = all_pending
        if reserved_quantity and len(all_pending) > reserved_quantity:
            remaining_by_quantity = all_pending_sorted[reserved_quantity:]
        
        remaining_by_time = all_pending
        if reserved_time_length:
            max_created_at = all_pending_sorted[0].created_at
            time_threshold = max_created_at - timedelta(minutes=reserved_time_length) if max_created_at else None
            remaining_by_time = [r for r in all_pending if r.created_at and r.created_at.replace(tzinfo=timezone.utc) < time_threshold] if time_threshold else []
        
        if len(remaining_by_quantity) <= len(remaining_by_time):
            return remaining_by_quantity
        else:
            return remaining_by_time

    async def get_pending_chat_delete2(self, reserved_quantity: int = None, reserved_time_length: int = None) -> list[ClientRequest]:
        from datetime import datetime, timedelta, timezone

        all_pending = await self.client_request_dao.get_pending_chat_delete()

        if not all_pending:
            return []

        if reserved_time_length:
            all_pending_sorted = sorted(all_pending, key=lambda x: x.created_at or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
            max_created_at = all_pending_sorted[0].created_at
            time_threshold = max_created_at - timedelta(minutes=reserved_time_length) if max_created_at else None
            return [r for r in all_pending if r.created_at and r.created_at.replace(tzinfo=timezone.utc) < time_threshold] if time_threshold else []

        if reserved_quantity and len(all_pending) > reserved_quantity:
            all_pending_sorted = sorted(all_pending, key=lambda x: x.created_at or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
            return all_pending_sorted[reserved_quantity:]

        return all_pending