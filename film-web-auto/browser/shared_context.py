from playwright.async_api import Page, BrowserContext
from browser.manager import browser_manager, get_storage_state_path
import os

class SharedBrowserContextManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self, storage_state_path: str = None):
        if self._initialized:
            return
        self.max_pool_size = 3
        self.storage_state_path = storage_state_path or get_storage_state_path("jimeng")
        self._contexts: list[BrowserContext] = []
        self._pages: list[Page] = []
        self._available_pages: list[Page] = []
        self._initialized = True
    
    async def _create_context_and_page(self):
        print(f"[SharedContext] storage_state_path: {self.storage_state_path}")
        print(f"[SharedContext] file exists: {os.path.exists(self.storage_state_path)}")
        
        if os.path.exists(self.storage_state_path):
            print(f"[SharedContext] 加载已存储的登录信息...")
            ctx = await browser_manager.new_context(storage_state=self.storage_state_path)
        else:
            print(f"[SharedContext] 未找到登录信息，创建新上下文...")
            ctx = await browser_manager.new_context()
        page = await ctx.new_page()
        self._contexts.append(ctx)
        self._pages.append(page)
        self._available_pages.append(page)
        return page
    
    async def get_page(self) -> Page:
        if not self._available_pages:
            if len(self._contexts) < self.max_pool_size:
                return await self._create_context_and_page()
            else:
                raise Exception("No available pages in pool")
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
        self._initialized = False

shared_ctx_manager = SharedBrowserContextManager()