from playwright.async_api import Page
from core.config import settings
import os


class BasePage:
    def __init__(self, page: Page = None, url: str = ""):
        self.page = page
        self.url = url

    async def navigate(self):
        if self.page.url != self.url:
            await self.page.goto(self.url, timeout=settings.TASK_TIMEOUT)
            await self.page.wait_for_load_state("domcontentloaded", timeout=settings.TASK_TIMEOUT)

    async def navigate_async(self):
        await self.page.goto(self.url, timeout=settings.TASK_TIMEOUT)
        await self.page.wait_for_load_state("load", timeout=settings.TASK_TIMEOUT)

        print("[BasePage] 页面加载完成，等待 3 秒...")
        await self.page.wait_for_timeout(3000)

    async def wait_for_selector(self, selector: str, timeout: int = 30000):
        await self.page.wait_for_selector(selector, timeout=timeout)
