from pydantic import BaseModel
from typing import Optional, List


class BaseResponse(BaseModel):
    request_id: Optional[str]

class GenerationResponse(BaseResponse):
    result: Optional[str]

class GetResponse(BaseResponse):
    tasks: List[dict]


class Result(BaseModel):
    code: int = 200
    data: Optional[dict] = None
    message: Optional[str] = None
    success: bool = True