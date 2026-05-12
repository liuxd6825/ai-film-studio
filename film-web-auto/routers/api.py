from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from schemas.request import VideoGenerateRequest, ImageGenerateRequest, VideoGenerateBatchRequest, ImageGenerateBatchRequest, GeminiImageGenerateRequest, GeminiImageGenerateBatchRequest, GeminiChatRemoveRequest
from database.connection import get_db
from routers.api_service import api_service

router = APIRouter(prefix="/api/v1")


@router.post("/video/generate")
async def generate_video(req: VideoGenerateRequest, session: AsyncSession = Depends(get_db)):
    result = await api_service.generate_video(session, req)
    return JSONResponse(content=result.model_dump())


@router.post("/image/generate")
async def generate_image(req: ImageGenerateRequest, session: AsyncSession = Depends(get_db)):
    result = await api_service.generate_image(session, req)
    return JSONResponse(content=result.model_dump())

@router.get("/request/{request_id}/result")
async def get_request_result(request_id: str, session: AsyncSession = Depends(get_db)):
    result = await api_service.get_request_result(session, request_id)
    return JSONResponse(content=result.model_dump())

@router.get("/request/{request_id}")
async def get_request(request_id: str, session: AsyncSession = Depends(get_db)):
    result = await api_service.get_request(session, request_id)
    return JSONResponse(content=result.model_dump())


@router.post("/gemini/image/generate")
async def generate_gemini_image(req: GeminiImageGenerateRequest, session: AsyncSession = Depends(get_db)):
    result = await api_service.generate_gemini_image(session, req)
    return JSONResponse(content=result.model_dump())

@router.delete("/gemini/chat/remove")
async def remove_gemini_chat(req: GeminiChatRemoveRequest):
    result = await api_service.remove_gemini_chat(req)
    return JSONResponse(content=result.model_dump())

# @router.post("/gemini/image/generates")
# async def generate_gemini_images(req: GeminiImageGenerateBatchRequest, session: AsyncSession = Depends(get_db)):
#     result = await api_service.generate_gemini_images(session, req)
#     return JSONResponse(content=result.model_dump())
#
# @router.post("/video/generates")
# async def generate_videos(req: VideoGenerateBatchRequest, session: AsyncSession = Depends(get_db)):
#     result = await api_service.generate_videos(session, req)
#     return JSONResponse(content=result.model_dump())
#
# @router.post("/image/generates")
# async def generate_images(req: ImageGenerateBatchRequest, session: AsyncSession = Depends(get_db)):
#     result = await api_service.generate_images(session, req)
#     return JSONResponse(content=result.model_dump())