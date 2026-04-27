class JimengException(Exception):
    pass

class PageLoadError(JimengException):
    pass

class ActionTimeoutError(JimengException):
    pass

class UploadError(JimengException):
    pass

class GenerationError(JimengException):
    pass
