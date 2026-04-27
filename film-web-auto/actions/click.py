from .base import BaseAction

class ClickAction(BaseAction):
    def execute(self, selector: str, **kwargs):
        self._locator(selector).click(**kwargs)

class ClickByTextAction(BaseAction):
    def execute(self, text: str, **kwargs):
        self.page.get_by_text(text, **kwargs).click()

class ClickByRoleAction(BaseAction):
    def execute(self, role: str, **kwargs):
        self.page.get_by_role(role, **kwargs).click()