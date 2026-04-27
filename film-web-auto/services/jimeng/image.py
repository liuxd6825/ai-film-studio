from services.base import BaseService
from pages.jimeng import JimengPage
from browser.manager import browser_manager
from core.config import settings
from services.task_service import TaskService
from sqlalchemy.ext.asyncio import AsyncSession
import os


class ImageGenerationService(BaseService):
    async def generate(
        self,
        session: AsyncSession,
        model: str,
        files: list[str],
        prompt: str,
        aspect_ratio: str,
        resolution: str = None,
        width: int = None,
        height: int = None,
        request_id: str = None,
        workspace: str = "0",
        **kwargs
    ):
        jimeng = None
        task_service = TaskService(session)
        try:
            jimeng = JimengPage(page = None, workspace=workspace)

            if not await jimeng.wait_for_login_v2(headless=settings.BROWSER_HEADLESS):
                data = {
                    "id": request_id + "_error",
                    "request_id": request_id,
                    "workspace": workspace,
                    "data_id": "",
                    "type": "image",
                    "system": "jimeng",
                    "status": "failed",
                    "desc": "Login timeout",
                }
                try:
                    await task_service.create_task(data)
                    await session.commit()
                except Exception:
                    await session.rollback()
                return {"success": False, "status":"Failed", "result": "Login timeout"}

            await jimeng.navigate()

            await jimeng.select_generation_mode("图片生成")
            await jimeng.select_model(model)

            await jimeng.open_settings_popup()

            if aspect_ratio:
                await jimeng.select_aspect_ratio(aspect_ratio)
            if resolution:
                await jimeng.select_resolution(resolution)
            if width or height:
                await jimeng.set_dimensions(width, height)

            if files:
                await jimeng.upload_reference_images(files)
            await jimeng.input_prompt(prompt)

            await jimeng.submit()

            result = await jimeng.wait_for_generation_complete_v2(timeout=settings.TASK_TIMEOUT)

            status = result["status"]
            message = result["message"]

            if status == "invalid":
                data = {
                    "id": request_id + "_error",
                    "request_id": request_id,
                    "workspace": workspace,
                    "data_id": "",
                    "type": "image",
                    "system": "jimeng",
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
                    "system": "jimeng",
                    "status": result["status"],
                }
            else:
                data = {
                    "id": request_id + "_error",
                    "request_id": request_id,
                    "workspace": workspace,
                    "data_id": "",
                    "type": "image",
                    "system": "jimeng",
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
                "workspace": workspace,
                "data_id": "",
                "type": "image",
                "system": "jimeng",
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
            if jimeng and jimeng.page:
                await browser_manager.close_page(jimeng.page)