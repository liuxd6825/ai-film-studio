from pydantic import BaseModel, Field
from typing import Optional

class VideoGenerateRequest(BaseModel):
    model: Optional[str] = None
    work_type: Optional[str] = None
    files_url: Optional[list[str]] = None
    prompt: Optional[str] = None
    aspect_ratio: Optional[str] = None
    seed: Optional[str] = None
    workspace: str = "0"

class ImageGenerateRequest(BaseModel):
    model: Optional[str] = None
    files_url: Optional[list[str]] = None
    prompt: Optional[str] = None
    aspect_ratio: Optional[str] = None
    resolution: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    workspace: str = "0"


class VideoGenerateBatchRequest(BaseModel):
    requests: list[VideoGenerateRequest]
    workspace: str = "0"

class ImageGenerateBatchRequest(BaseModel):
    requests: list[ImageGenerateRequest]
    workspace: str = "0"


class GeminiImageGenerateRequest(BaseModel):
    model: Optional[str] = "快速"
    files_url: Optional[list[str]] = None
    prompt: Optional[str] = None
    workspace: Optional[str] = None


class GeminiImageGenerateBatchRequest(BaseModel):
    requests: list[GeminiImageGenerateRequest]


class GeminiChatRemoveRequest(BaseModel):
    reserved_quantity: Optional[int] = None
    reserved_time_length: Optional[int] = None