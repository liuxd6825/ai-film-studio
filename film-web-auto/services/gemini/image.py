from services.base import BaseService
from pages.gemini import GeminiPage
from browser.manager import browser_manager
from core.config import settings
from services.task_service import TaskService
from sqlalchemy.ext.asyncio import AsyncSession
import os


class ImageGenerationService(BaseService):
    async def generate(
        self,
        session: AsyncSession,
        files: list[str],
        prompt: str,
        model: str = None,
        request_id: str = None,
        **kwargs
    ):
        gemini = None
        task_service = TaskService(session)
        try:
            gemini = GeminiPage(page = None)

            if not await gemini.wait_for_login_v2(headless=settings.BROWSER_HEADLESS):
                data = {
                    "id": request_id + "_error",
                    "request_id": request_id,
                    "workspace": "",
                    "data_id": "",
                    "type": "image",
                    "system": "gemini",
                    "status": "failed",
                    "desc": "Login timeout",
                }
                try:
                    await task_service.create_task(data)
                    await session.commit()
                except Exception:
                    await session.rollback()
                return {"success": False, "status": "Failed", "result": "Login timeout"}

            await gemini.navigate()

            await gemini.select_image_generation_tool("制作图片")

            await gemini.select_model(model=model)

            if files and len(files) > 0:
                await gemini.upload_files(files)

            await gemini.input_prompt(prompt)

            await gemini.submit()

            result = None
            if model == "快速":
                result = await gemini.wait_for_generation_complete(timeout=settings.TASK_TIMEOUT)
            else:
                result = await gemini.wait_for_generation_complete_v2(timeout=settings.TASK_TIMEOUT)

            if result is None:
                data = {
                    "id": request_id + "_error",
                    "request_id": request_id,
                    "workspace": "",
                    "data_id": "",
                    "type": "image",
                    "system": "gemini",
                    "status": "failed",
                    "desc": "模型不匹配",
                }
                try:
                    await task_service.create_task(data)
                    await session.commit()
                except Exception:
                    await session.rollback()
                return {"success": False, "status": "Failed", "result": "模型不匹配"}

            status = result["status"]
            message = result["message"]
            workspace = result["workspace"]

            if status == "invalid":
                data = {
                    "id": request_id + "_error",
                    "request_id": request_id,
                    "workspace": workspace,
                    "data_id": "",
                    "type": "image",
                    "system": "gemini",
                    "status": "failed",
                    "desc": message,
                }
                try:
                    await task_service.create_task(data)
                    await session.commit()
                except Exception:
                    await session.rollback()
                return {"success": False, "status": status, "result": message}
            data = {}
            if result["data_id"]:
                data = {
                    "id": result["data_id"],
                    "request_id": request_id,
                    "workspace": workspace,
                    "data_id": result["data_id"],
                    "type": "image",
                    "system": "gemini",
                    "status": status,
                }
            else:
                data = {
                    "id": request_id + "_error",
                    "request_id": request_id,
                    "workspace": workspace,
                    "data_id": "",
                    "type": "image",
                    "system": "gemini",
                    "status": "failed",
                    "desc": "generate error, not found 'data-id'",
                }

            await task_service.create_task(data)
            await session.commit()

            return {"success": True, "status": status, "result": message}
        except Exception as e:
            data = {
                "id": request_id + "_error",
                "request_id": request_id,
                "workspace": "",
                "data_id": "",
                "type": "image",
                "system": "gemini",
                "status": "failed",
                "desc": f"{e}",
            }
            try:
                await task_service.create_task(data)
                await session.commit()
            except Exception:
                await session.rollback()
            return {"success": False, "status": "Failed", "result": f"{e}"}
        finally:
            if gemini and gemini.page:
                await browser_manager.close_page(gemini.page)
