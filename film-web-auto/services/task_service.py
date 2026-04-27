from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from dao.task import TaskDAO
from dao.task_result import TaskResultDAO
from models.task import Task
from models.task_result import TaskResult


class TaskService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.task_dao = TaskDAO(session)
        self.task_result_dao = TaskResultDAO(session)
    
    async def create_task(self, task_data: dict) -> Task:
        return await self.task_dao.create(task_data)
    
    async def get_task(self, task_id: str) -> Optional[Task]:
        return await self.task_dao.get_by_id(task_id)
    
    async def get_task_by_data_id(self, data_id: str) -> Optional[Task]:
        return await self.task_dao.get_by_data_id(data_id)
    
    async def get_tasks(
        self,
        status: str = None,
        project_id: str = None,
        limit: int = None,
        offset: int = None
    ) -> list[Task]:
        filters = {}
        if status:
            filters["status"] = status
        if project_id:
            filters["project_id"] = project_id
        return await self.task_dao.get_all(filters=filters, order_by="created_at", order_desc=True, limit=limit, offset=offset)
    
    async def update_task(self, task_id: str, task_data: dict) -> Optional[Task]:
        return await self.task_dao.update(task_id, task_data)
    
    async def update_task_status(self, task_id: str, status: str, desc: str = None) -> Optional[Task]:
        return await self.task_dao.update_status(task_id, status, desc)
    
    async def delete_task(self, task_id: str) -> bool:
        return await self.task_dao.delete(task_id)
    
    async def create_task_with_results(self, task_data: dict, result_files: list[dict]) -> tuple[Task, list[TaskResult]]:
        task = await self.task_dao.create(task_data)
        
        task_results = []
        for result_file in result_files:
            result_data = {
                "id": result_file.get("id"),
                "task_id": task.id,
                "file_name": result_file.get("file_name"),
                "file_path": result_file.get("file_path")
            }
            task_result = await self.task_result_dao.create(result_data)
            task_results.append(task_result)
        
        return task, task_results
    
    async def get_task_with_results(self, task_id: str) -> tuple[Optional[Task], list[TaskResult]]:
        task = await self.task_dao.get_by_id(task_id)
        if not task:
            return None, []
        
        results = await self.task_result_dao.get_by_task_id(task_id)
        return task, results
    
    async def add_results_to_task(self, task_id: str, result_files: list[dict]) -> list[TaskResult]:
        task = await self.task_dao.get_by_id(task_id)
        if not task:
            raise ValueError(f"Task {task_id} not found")
        
        task_results = []
        for result_file in result_files:
            result_data = {
                "id": result_file.get("id"),
                "task_id": task_id,
                "file_name": result_file.get("file_name"),
                "file_path": result_file.get("file_path")
            }
            task_result = await self.task_result_dao.create(result_data)
            task_results.append(task_result)
        
        return task_results
    
    async def get_tasks_by_request_id(self, request_id: str) -> list[Task]:
        return await self.task_dao.get_all(filters={"request_id": request_id})
    
    async def get_results_by_task_ids(self, task_ids: list[str]) -> list[TaskResult]:
        results = []
        for task_id in task_ids:
            task_results = await self.task_result_dao.get_by_task_id(task_id)
            results.extend(task_results)
        return results
