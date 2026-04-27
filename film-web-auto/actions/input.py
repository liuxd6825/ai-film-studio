from .base import BaseAction

class InputAction(BaseAction):
    def execute(self, selector: str, value: str, **kwargs):
        self._locator(selector).fill(value, **kwargs)

class TypeAction(BaseAction):
    def execute(self, selector: str, value: str, delay: int = 0, **kwargs):
        self._locator(selector).type(value, delay=delay, **kwargs)