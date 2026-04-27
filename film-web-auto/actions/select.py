from .base import BaseAction

class SelectAction(BaseAction):
    def execute(self, selector: str, value: str, **kwargs):
        self._locator(selector).select_option(value, **kwargs)

class ClickFirstAction(BaseAction):
    def execute(self, selector: str, **kwargs):
        self._locator(selector).first.click(**kwargs)