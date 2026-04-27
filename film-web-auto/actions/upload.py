from .base import BaseAction
import os

class UploadAction(BaseAction):
    def execute(self, selector: str, file_paths: list[str], **kwargs):
        abs_paths = [os.path.abspath(p) for p in file_paths]
        self._locator(selector).set_input_files(abs_paths, **kwargs)