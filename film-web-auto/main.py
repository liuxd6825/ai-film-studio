from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import os
from routers.api import router
from browser.manager import browser_manager
from core.config import settings
from utils.image import cleanup_old_images
from database.connection import init_db
from schedule.scanner import scanner_service
from schedule.gemini_chat_remove_scanner import gemini_chat_remove_scanner_service


async def cleanup_task():
    while True:
        await asyncio.sleep(300)
        cleanup_old_images(hours=8)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[Main] 初始化数据库...")
    await init_db()
    print("[Main] 数据库初始化完成")
    print("[Main] 启动清理任务...")
    cleanup_task_handle = asyncio.create_task(cleanup_task())
    scanner_task_handle = None
    gemini_chat_remove_scanner_task_handle = None
    if settings.SCANNER_ENABLED:
        print("[Main] 启动扫描任务...")
        scanner_task_handle = asyncio.create_task(scanner_service.start())
        print("[Main] 扫描任务已启动")
    else:
        print("[Main] 扫描任务已禁用")
    if settings.GEMINI_CHAT_REMOVE_SCANNER_ENABLED:
        print("[Main] 启动Gemini聊天清理扫描任务...")
        gemini_chat_remove_scanner_task_handle = asyncio.create_task(gemini_chat_remove_scanner_service.start())
        print("[Main] Gemini聊天清理扫描任务已启动")
    else:
        print("[Main] Gemini聊天清理扫描任务已禁用")
    yield
    cleanup_task_handle.cancel()
    if scanner_task_handle:
        scanner_task_handle.cancel()
    if gemini_chat_remove_scanner_task_handle:
        gemini_chat_remove_scanner_task_handle.cancel()
    await browser_manager.stop()
    print("[Main] 浏览器已关闭")

app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)
app.include_router(router)

os.makedirs(settings.DOWNLOAD_CACHE_DIR, exist_ok=True)
app.mount("/downloads", StaticFiles(directory=settings.DOWNLOAD_CACHE_DIR), name="downloads")

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)
