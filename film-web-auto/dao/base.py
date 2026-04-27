from typing import TypeVar, Generic, Type, Optional, Any
from sqlalchemy import select, update, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from database.connection import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseDAO(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], session: AsyncSession):
        self.model = model
        self.session = session
    
    async def create(self, data: dict) -> ModelType:
        instance = self.model(**data)
        self.session.add(instance)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance
    
    async def create_many(self, data_list: list[dict]) -> list[ModelType]:
        instances = [self.model(**data) for data in data_list]
        self.session.add_all(instances)
        await self.session.flush()
        for instance in instances:
            await self.session.refresh(instance)
        return instances
    
    async def get_by_id(self, id: str) -> Optional[ModelType]:
        result = await self.session.execute(
            select(self.model).where(self.model.__table__.primary_key.columns.values()[0] == id)
        )
        return result.scalar_one_or_none()
    
    async def get_one(self, filters: dict) -> Optional[ModelType]:
        query = select(self.model)
        for key, value in filters.items():
            if hasattr(self.model, key):
                query = query.where(getattr(self.model, key) == value)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_all(
        self,
        filters: dict = None,
        order_by: str = None,
        order_desc: bool = False,
        limit: int = None,
        offset: int = None
    ) -> list[ModelType]:
        query = select(self.model)
        
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    query = query.where(getattr(self.model, key) == value)
        
        if order_by and hasattr(self.model, order_by):
            order_column = getattr(self.model, order_by)
            if order_desc:
                query = query.order_by(order_column.desc())
            else:
                query = query.order_by(order_column.asc())
        
        if offset is not None:
            query = query.offset(offset)
        if limit is not None:
            query = query.limit(limit)
        
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def count(self, filters: dict = None) -> int:
        query = select(func.count()).select_from(self.model)
        
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    query = query.where(getattr(self.model, key) == value)
        
        result = await self.session.execute(query)
        return result.scalar() or 0
    
    async def update(self, id: str, data: dict) -> Optional[ModelType]:
        instance = await self.get_by_id(id)
        if instance:
            for key, value in data.items():
                if hasattr(instance, key):
                    setattr(instance, key, value)
            await self.session.flush()
            await self.session.refresh(instance)
        return instance
    
    async def update_by(self, filters: dict, data: dict) -> int:
        query = update(self.model).where(
            *(getattr(self.model, key) == value for key, value in filters.items() if hasattr(self.model, key))
        )
        query = query.values(**data)
        result = await self.session.execute(query)
        await self.session.flush()
        return result.rowcount
    
    async def delete(self, id: str) -> bool:
        instance = await self.get_by_id(id)
        if instance:
            await self.session.delete(instance)
            await self.session.flush()
            return True
        return False
    
    async def delete_by(self, filters: dict) -> int:
        query = delete(self.model).where(
            *(getattr(self.model, key) == value for key, value in filters.items() if hasattr(self.model, key))
        )
        result = await self.session.execute(query)
        await self.session.flush()
        return result.rowcount
    
    async def exists(self, filters: dict) -> bool:
        count_result = await self.count(filters)
        return count_result > 0
