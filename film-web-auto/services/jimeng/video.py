from services.base import BaseService
from pages.jimeng import JimengPage
from browser.manager import browser_manager
from core.config import settings
from services.task_service import TaskService
from sqlalchemy.ext.asyncio import AsyncSession
import os


class VideoGenerationService(BaseService):
    async def generate(
        self,
        session: AsyncSession,
        model: str,
        work_type: str,
        files: list[str],
        prompt: str,
        aspect_ratio: str = None,
        seed: str = None,
        request_id: str = None,
        workspace: str = "0",
        **kwargs
    ):
        jimeng = None
        task_service = TaskService(session)
        try:
            jimeng = JimengPage(page = None, workspace=workspace)
            
            if not await jimeng.wait_for_login_v2():
                data = {
                    "id": request_id + "_error",
                    "request_id": request_id,
                    "workspace": workspace,
                    "data_id": "",
                    "type": "video",
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

            await jimeng.close_modal_dialog()

            await jimeng.select_generation_mode("视频生成")
            await jimeng.select_reference_type(work_type)
            await jimeng.select_model_v2(model)

            if aspect_ratio:
                await jimeng.select_aspect_ratio_v2(aspect_ratio)
            if seed:
                await jimeng.set_seed(seed)

            if files:
                await jimeng.upload_reference_images(files)
            data_id = await jimeng.input_prompt(prompt)

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
                    "type": "video",
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

            data = {
                "id": data_id,
                "request_id": request_id,
                "workspace": workspace,
                "data_id": data_id,
                "type": "video",
                "system": "jimeng",
                "status": result["status"],
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
                "type": "video",
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
                pass
                # await browser_manager.close_page(jimeng.page)