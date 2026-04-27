from abc import ABC, abstractmethod
from playwright.async_api import Page
from browser.shared_context import shared_ctx_manager

class BaseService(ABC):
    async def get_page(self) -> Page:
        return await shared_ctx_manager.get_page()
    
    async def release_page(self, page: Page):
        await shared_ctx_manager.release_page(page)
    
    @abstractmethod
    async def generate(self, **kwargs):
        pass
