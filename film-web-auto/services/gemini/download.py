import asyncio
import os
import uuid
from pathlib import Path

from browser.manager import browser_manager
from core.config import settings
from utils.browser import (
    scroll_element_to_top, scroll_element_up_by, get_element_scroll_position,
    find_scrollable_virtual_list
)


FAIL_TEXTS = [
    "图片不符合平台规则",
    "素材中包含人脸信息",
    "网络不顺畅",
    "服务器拥挤",
]

WAIT_TEXTS = [
    "排队加速中",
    "排队中",
    "造梦中",
    "智能创意中",
]

DEFAULT_SCROLL_DISTANCE = 600


class GeminiDownload:
    @staticmethod
    async def download(task, task_result, page):
        download_urls = []
        file_names = []

        workspace_dir = os.path.join(settings.DOWNLOAD_CACHE_DIR, task.system, task.workspace or "0")
        Path(workspace_dir).mkdir(parents=True, exist_ok=True)

        selector = f"#model-response-message-contentr_{task.id} > p > div > response-element > generated-image > single-image > div > div > div > download-generated-image-button > button"

        download_btns = page.locator(selector)

        download_btn_count = await download_btns.count()

        for i in range(download_btn_count):
            download_btn = download_btns.nth(i)
            await asyncio.sleep(0.2)
            if await download_btn.count() > 0:
                try:
                    async with page.expect_download(timeout=settings.TASK_TIMEOUT) as download_info:
                        await download_btn.first.click(force=True)
                    download = await download_info.value
                    filename = download.suggested_filename or f"{uuid.uuid4()}.tmp"
                    filepath = os.path.join(workspace_dir, filename)
                    Path(filepath).parent.mkdir(parents=True, exist_ok=True)
                    await download.save_as(filepath)
                    file_names.append(filename)
                    file_url = f"{settings.DOWNLOAD_URL_PREFIX}/downloads/{task.workspace}/{filename}"

                    download_urls.append(file_url)
                    print(f"[GeminiDownload] Downloaded: {file_url}")
                except Exception as e:
                    print(f"[GeminiDownload] Download failed for task {task.id}: {e}")
                    raise

        task_result["download_urls"] = download_urls
        task_result["file_names"] = file_names
        return task_result

    @classmethod
    async def process_task(cls, page, task, task_service, session, scroll_distance: int = DEFAULT_SCROLL_DISTANCE):

        # selector = f"#{task.id} model-response button[data-test-id='download-generated-image-button']"
        # button_el = page.locator(selector)

        # for fail_text in FAIL_TEXTS:
        #     if fail_text in text:
        #         print(f"[GeminiDownload] Task {task.id} validation failed: {fail_text}")
        #         await task_service.update_task_status(task.id, "failed", fail_text)
        #         return
        #
        # for wait_text in WAIT_TEXTS:
        #     if wait_text in text:
        #         print(f"[GeminiDownload] Task {task.id} still waiting: {wait_text}")
        #         return
        #
        # print(f"[GeminiDownload] Task {task.id} ready for download")

        task_result = {}
        try:
            await cls.download(task, task_result, page)
        except Exception as e:
            await task_service.update_task_status(task.id, "failed", str(e))
            return

        file_names = task_result.get("file_names", [])
        if file_names:
            res_list = [{"id": str(uuid.uuid4()), "file_name": fn} for fn in file_names]
            await task_service.add_results_to_task(task.id, res_list)
            await task_service.update_task_status(task.id, "completed")
            print(f"[GeminiDownload] Task {task.id} completed with {len(file_names)} files")
        else:
            await task_service.update_task_status(task.id, "failed", "No files found")
            print(f"[GeminiDownload] Task {task.id} no files found, marked as failed")