from pydantic_settings import BaseSettings
import os
import yaml

def load_config():
    config_path = os.path.join(os.path.dirname(__file__), "..", "config", "config.yaml")
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    return {}

class Settings(BaseSettings):
    APP_NAME: str = "jimeng-auto"
    JIMENG_URL: str = "https://jimeng.jianying.com/ai-tool/generate"
    GEMINI_URL: str = "https://gemini.google.com/app"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    BROWSER_HEADLESS: bool = False
    BROWSER_TIMEOUT: int = 30000
    BROWSER_CHANNEL: str = "chrome"
    BROWSER_WIDTH: int = 1440
    BROWSER_HEIGHT: int = 768
    TASK_TIMEOUT: int = 120000
    PROFILE_DIR: str = os.path.join(os.path.dirname(__file__), "..", "cache", "profiles")
    IMAGE_CACHE_DIR: str = os.path.join(os.path.dirname(__file__), "..", "cache", "images")
    DOWNLOAD_CACHE_DIR: str = os.path.join(os.path.dirname(__file__), "..", "cache", "downloads")
    DOWNLOAD_URL_PREFIX: str = "http://192.168.120.109:8000"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/jimeng"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    SCANNER_INTERVAL: int = 300
    SCANNER_WAIT_TIME: int = 10
    SCANNER_RETRY_LIMIT: int = 3
    SCANNER_ENABLED: bool = True
    GEMINI_CHAT_REMOVE_SCANNER_INTERVAL: int = 60
    GEMINI_CHAT_REMOVE_SCANNER_ENABLED: bool = True
    GEMINI_CHAT_REMOVE_SCANNER_RESERVED_QUANTITY: int = 50
    GEMINI_CHAT_REMOVE_SCANNER_RESERVED_TIME_LENGTH: int = 1440
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        config = load_config()
        if config:
            self._apply_config(config)
    
    def _apply_config(self, config: dict):
        app_config = config.get("app", {})
        if app_config.get("name"):
            self.APP_NAME = app_config["name"]
        if app_config.get("host"):
            self.HOST = app_config["host"]
        if app_config.get("port"):
            self.PORT = app_config["port"]
        if app_config.get("urls", {}).get("jimeng"):
            self.JIMENG_URL = app_config["urls"]["jimeng"]
        if app_config.get("urls", {}).get("gemini"):
            self.GEMINI_URL = app_config["urls"]["gemini"]
        
        browser_config = config.get("browser", {})
        if browser_config.get("headless") is not None:
            self.BROWSER_HEADLESS = browser_config["headless"]
        if browser_config.get("timeout"):
            self.BROWSER_TIMEOUT = browser_config["timeout"]
        if browser_config.get("channel"):
            self.BROWSER_CHANNEL = browser_config["channel"]
        if browser_config.get("width"):
            self.BROWSER_WIDTH = browser_config["width"]
        if browser_config.get("height"):
            self.BROWSER_HEIGHT = browser_config["height"]
        
        task_config = config.get("task", {})
        if task_config.get("timeout"):
            self.TASK_TIMEOUT = task_config["timeout"]
        
        storage_config = config.get("storage", {})
        if storage_config.get("profile_dir"):
            self.PROFILE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), storage_config["profile_dir"])
        if storage_config.get("image_cache_dir"):
            self.IMAGE_CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), storage_config["image_cache_dir"])
        if storage_config.get("download_cache_dir"):
            self.DOWNLOAD_CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), storage_config["download_cache_dir"])
        if storage_config.get("download_url_prefix"):
            self.DOWNLOAD_URL_PREFIX = storage_config["download_url_prefix"]
        
        database_config = config.get("database", {})
        if database_config.get("url"):
            self.DATABASE_URL = database_config["url"]
        if database_config.get("pool_size"):
            self.DATABASE_POOL_SIZE = database_config["pool_size"]
        if database_config.get("max_overflow"):
            self.DATABASE_MAX_OVERFLOW = database_config["max_overflow"]
        
        scanner_config = config.get("scanner", {})
        if scanner_config.get("enabled") is not None:
            self.SCANNER_ENABLED = scanner_config["enabled"]
        if scanner_config.get("interval"):
            self.SCANNER_INTERVAL = scanner_config["interval"]
        if scanner_config.get("wait_time"):
            self.SCANNER_WAIT_TIME = scanner_config["wait_time"]
        if scanner_config.get("retry_limit"):
            self.SCANNER_RETRY_LIMIT = scanner_config["retry_limit"]

        gemini_chat_remove_scanner_config = config.get("gemini_chat_remove_scanner", {})
        if gemini_chat_remove_scanner_config.get("enabled") is not None:
            self.GEMINI_CHAT_REMOVE_SCANNER_ENABLED = gemini_chat_remove_scanner_config["enabled"]
        if gemini_chat_remove_scanner_config.get("interval"):
            self.GEMINI_CHAT_REMOVE_SCANNER_INTERVAL = gemini_chat_remove_scanner_config["interval"]
        if gemini_chat_remove_scanner_config.get("reserved_quantity"):
            self.GEMINI_CHAT_REMOVE_SCANNER_RESERVED_QUANTITY = gemini_chat_remove_scanner_config["reserved_quantity"]
        if gemini_chat_remove_scanner_config.get("reserved_time_length"):
            self.GEMINI_CHAT_REMOVE_SCANNER_RESERVED_TIME_LENGTH = gemini_chat_remove_scanner_config["reserved_time_length"]

settings = Settings()
