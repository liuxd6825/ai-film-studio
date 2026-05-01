from pydantic import BaseModel
from typing import Optional, List


class BaseResponse(BaseModel):
    request_id: Optional[str]

class GenerationResponse(BaseResponse):
    result: Optional[str]

class GetResponse(BaseResponse):
    tasks: List[dict]


class Result(BaseModel):
    taskId : str=""
    code: int = 200
    data: Optional[dict] = None
    message: Optional[str] = None
    success: bool = True
    status: str=""

class TaskStatusResponse(BaseModel):
    taskId : str
    status : str
    workspace : str
    desc : str
    system : str