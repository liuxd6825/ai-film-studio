from abc import ABC, abstractmethod
from playwright.sync_api import Page, Locator

class BaseAction(ABC):
    def __init__(self, page: Page):
        self.page = page
    
    @abstractmethod
    def execute(self, *args, **kwargs):
        pass
    
    def _locator(self, selector: str) -> Locator:
        return self.page.locator(selector)