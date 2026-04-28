import asyncio
import uuid

from browser.manager import browser_manager
from core.config import settings
from database.connection import AsyncSessionLocal
from pages.jimeng import JimengPage
from pages.gemini import GeminiPage
from services.jimeng import JimengDownload
from services.gemini import GeminiDownload
from services.task_service import TaskService
from utils.browser import (
    scroll_to_bottom, scroll_to_page_bottom, scroll_up_by, scroll_to_top,
    scroll_element_to_bottom, scroll_element_up_by, get_element_scroll_position,
    find_scrollable_virtual_list, scroll_element_to_top
)


class ScannerService:
    _is_running: bool = False

    async def start(self):
        while True:
            if ScannerService._is_running:
                print("[Scanner] Previous scan still running, skipping this cycle...")
                await asyncio.sleep(settings.SCANNER_INTERVAL)
                continue

            ScannerService._is_running = True
            try:
                await self._scan_once()
            except Exception as e:
                print(f"[Scanner] Scan error: {e}")
            finally:
                ScannerService._is_running = False
            await asyncio.sleep(settings.SCANNER_INTERVAL)

    async def _scan_once(self):
        async with AsyncSessionLocal() as session:
            task_service = TaskService(session)
            tasks = await task_service.get_tasks(status="generating")
            print(f"[Scanner] Found {len(tasks)} generating tasks")

        if not tasks:
            return

        tasks_by_workspace = {}
        for task in tasks:
            workspace = task.workspace or "0"
            key = f"{task.system}:{workspace}"
            if key not in tasks_by_workspace:
                tasks_by_workspace[key] = []
            tasks_by_workspace[key].append(task)

        page = None
        try:
            for key, workspace_tasks in tasks_by_workspace.items():
                if page:
                    await browser_manager.close_page(page)
                system = key.split(":")[0]
                workspace = key.split(":")[1]
                page = await browser_manager.new_page(system=system, headless= settings.BROWSER_HEADLESS)

                if system == "jimeng":
                    await self._process_jimeng(page, workspace, workspace_tasks)
                else:
                    await self._process_gemini(page, workspace, workspace_tasks)

        finally:
            if page:
                await browser_manager.close_page(page)

    async def _process_jimeng(self, page, workspace, workspace_tasks):
        jimeng = JimengPage(page, workspace=workspace)
        await jimeng.navigate_async()
        await asyncio.sleep(settings.SCANNER_WAIT_TIME)

        if not await jimeng._is_logged_in():
            print("[Scanner] Not logged in, skipping this cycle")
            return

        print(f"[Scanner] Logged in, processing {len(workspace_tasks)} tasks for workspace {workspace}...")

        async with AsyncSessionLocal() as session:
            task_service = TaskService(session)
            for task in workspace_tasks:
                await JimengDownload.process_task(page, task, task_service, session)
                await session.commit()

    async def _process_gemini(self, page, workspace, workspace_tasks):
        url = f"{settings.GEMINI_URL}/{workspace}"
        gemini = GeminiPage(page, url=url)
        await gemini.navigate_async()
        await asyncio.sleep(settings.SCANNER_WAIT_TIME)

        if not await gemini._is_logged_in():
            print("[Scanner] Not logged in, skipping this cycle")
            return

        await gemini.navigate()

        print(f"[Scanner] Logged in, processing {len(workspace_tasks)} tasks for workspace {workspace}...")

        async with AsyncSessionLocal() as session:
            task_service = TaskService(session)
            for task in workspace_tasks:
                await GeminiDownload.process_task(page, task, task_service, session)
                await session.commit()


scanner_service = ScannerService()