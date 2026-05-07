import asyncio
import os
import uuid
from pathlib import Path

from playwright.async_api import Locator

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
    "已取消生成",
    "生成已取消",
    "处于使用高峰期",
    "视频未通过审核",
    "内容可能不合规",
]

WAIT_TEXTS = [
    "排队加速中",
    "排队中",
    "造梦中",
    "智能创意中",
]

DEFAULT_SCROLL_DISTANCE = 600


class JimengDownload:
    @classmethod
    async def download(cls, task, task_result, page):
        download_urls = []
        file_names = []

        workspace_dir = os.path.join(settings.DOWNLOAD_CACHE_DIR, task.system, task.workspace or "0")
        Path(workspace_dir).mkdir(parents=True, exist_ok=True)

        target_div = await cls._get_target_div(page=page, data_id=task.id)

        if task.type == "video":
            items = target_div.locator("div[class*='video-card-wrapper-']")
        else:
            items = target_div.locator("div[class*='image-record-item-']")

        item_count = await items.count()
        print(f"[JimengDownload] Found {item_count} items to download for task {task.id}")

        for i in range(item_count):
            item = items.nth(i)
            await item.hover()
            await asyncio.sleep(1)
            op_btn = item.locator("div[class*='operation-button-']")
            if await op_btn.count() > 0:
                try:
                    async with page.expect_download(timeout=settings.TASK_TIMEOUT) as download_info:
                        await op_btn.first.click(force=True)
                    download = await download_info.value
                    filename = download.suggested_filename or f"{uuid.uuid4()}.tmp"
                    filepath = os.path.join(workspace_dir, filename)
                    Path(filepath).parent.mkdir(parents=True, exist_ok=True)
                    await download.save_as(filepath)
                    file_names.append(filename)
                    file_url = f"{settings.DOWNLOAD_URL_PREFIX}/downloads/{task.system}/{task.workspace or '0'}/{filename}"

                    download_urls.append(file_url)
                    print(f"[JimengDownload] Downloaded: {file_url}")
                except Exception as e:
                    print(f"[JimengDownload] Download failed for task {task.id}: {e}")
                    raise
            else:
                print(f"[JimengDownload] No operation button found for item {i}")

        task_result["download_urls"] = download_urls
        task_result["file_names"] = file_names
        return task_result

    @classmethod
    async def process_task(cls, page, task, task_service, session, scroll_distance: int = DEFAULT_SCROLL_DISTANCE):
        # virtual_list_selector = await find_scrollable_virtual_list(page)
        # if not virtual_list_selector:
        #     print(f"[JimengDownload] Could not find scrollable virtual list for task {task.id}")
        #     await task_service.update_task_status(task.id, "failed", "Could not find scrollable virtual list")
        #     return

        virtual_list_selector = "div[class^='virtua-list-']"

        await scroll_element_to_top(page, virtual_list_selector)
        await asyncio.sleep(1)

        target_div = await cls._get_target_div(page=page, data_id=task.id)

        while target_div is None:
            last_y = await get_element_scroll_position(page, virtual_list_selector)
            current_y = await scroll_element_up_by(page, virtual_list_selector, scroll_distance)
            await asyncio.sleep(1)
            max_pos = await page.evaluate(f"""
                () => {{
                    const el = document.querySelector('.record-virtual-list>div');
                    return el ? el.scrollHeight - el.clientHeight : 0;
                }}
            """)
            if current_y == last_y or current_y >= max_pos:
                await task_service.update_task_status(task.id, "failed", "Element not found, no more scrollable")
                return
            target_div = await cls._get_target_div(page=page, data_id=task.id)

        text = await target_div.locator("div[class^='record-box-']").text_content()

        await target_div.scroll_into_view_if_needed()
        await asyncio.sleep(1)

        for fail_text in FAIL_TEXTS:
            if fail_text in text:
                print(f"[JimengDownload] Task {task.id} validation failed: {fail_text}")
                await task_service.update_task_status(task.id, "failed", fail_text)
                return

        for wait_text in WAIT_TEXTS:
            if wait_text in text:
                print(f"[JimengDownload] Task {task.id} still waiting: {wait_text}")
                return

        print(f"[JimengDownload] Task {task.id} ready for download")

        task_result = {}
        try:
            await cls.download(task=task, task_result = task_result, page=page)
        except Exception as e:
            await task_service.update_task_status(task.id, "failed", str(e))
            return

        file_names = task_result.get("file_names", [])
        if file_names:
            res_list = [{"id": str(uuid.uuid4()), "file_name": fn} for fn in file_names]
            await task_service.add_results_to_task(task.id, res_list)
            await task_service.update_task_status(task.id, "completed")
            print(f"[JimengDownload] Task {task.id} completed with {len(file_names)} files")
        else:
            await task_service.update_task_status(task.id, "failed", "No files found")
            print(f"[JimengDownload] Task {task.id} no files found, marked as failed")

    @classmethod
    async def _get_target_div(self, page, data_id) -> Locator | None :
        div_list = page.locator("div[class^='virtua-list-']>div>div>div")
        div_list_count = await div_list.count()
        if div_list_count == 0:
            return None

        for i in range(div_list_count):
            div = div_list.nth(i)
            div_prompt = div.locator("div[class^='record-header-content-'] span[class^='prompt-value-container-']")
            if await div_prompt.count() > 0:
                text = await div_prompt.text_content() or ""
                if data_id in text:
                    return div

        return None