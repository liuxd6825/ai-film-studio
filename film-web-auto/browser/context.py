from playwright.async_api import Page, BrowserContext
from browser.manager import browser_manager, get_storage_state_path
import os


class BrowserContextManager:
    def __init__(self, pool_size: int = 3, storage_state_path: str = None):
        self.pool_size = pool_size
        self.storage_state_path = storage_state_path or get_storage_state_path("jimeng")
        self._contexts: list[BrowserContext] = []
        self._pages: list[Page] = []
        self._available_pages: list[Page] = []
    
    async def _ensure_contexts(self):
        while len(self._contexts) < self.pool_size:
            if os.path.exists(self.storage_state_path):
                ctx = await browser_manager.new_context(storage_state=self.storage_state_path)
            else:
                ctx = await browser_manager.new_context()
            self._contexts.append(ctx)
            page = await ctx.new_page()
            self._pages.append(page)
            self._available_pages.append(page)
    
    async def get_page(self) -> Page:
        await self._ensure_contexts()
        if not self._available_pages:
            if os.path.exists(self.storage_state_path):
                ctx = await browser_manager.new_context(storage_state=self.storage_state_path)
            else:
                ctx = await browser_manager.new_context()
            self._contexts.append(ctx)
            page = await ctx.new_page()
            self._pages.append(page)
            return page
        return self._available_pages.pop()
    
    async def release_page(self, page: Page):
        if page not in self._available_pages:
            self._available_pages.append(page)
    
    async def close_all(self):
        for ctx in self._contexts:
            await ctx.close()
        self._contexts.clear()
        self._pages.clear()
        self._available_pages.clear()
