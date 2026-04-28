from playwright.async_api import async_playwright, BrowserContext, Page
from playwright_stealth.stealth import Stealth
import os
import ctypes
import asyncio

from core.config import settings


def get_screen_size():
    return 1024, 1024
    # try:
    #     user32 = ctypes.windll.user32
    #     width = user32.GetSystemMetrics(0)
    #     height = user32.GetSystemMetrics(1)
    #     if width < 1024 or height < 768:
    #         return 1024, 768
    #     return width - 100, height - 150
    # except Exception:
    #     return 1024, 768


def get_storage_state_path(system: str) -> str:
    return os.path.join(os.path.dirname(__file__), "..", "storage", f"{system}_storage_state.json")


class BrowserManager:
    _instance = None
    _playwright = None
    _browser = None
    _context: dict = {}
    _lock = asyncio.Lock()
    _pages: dict = {}

    @classmethod
    async def _ensure_browser(cls, system: str = None, headless: bool = False):

        user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        width, height = get_screen_size()
        if cls._playwright is None:
            cls._playwright = await async_playwright().start()

        cls._context[system] = await cls._playwright.chromium.launch_persistent_context(
            user_data_dir=f"{settings.PROFILE_DIR}/{system}",
            headless=headless,
            channel="chrome",
            user_agent=user_agent,
            viewport={"width": width, "height": height},
            ignore_default_args=["--enable-automation"],
            args=[
                "--disable-blink-features=AutomationControlled",
            ],
        )

    @classmethod
    async def get_context(cls, system: str = None, headless: bool = False):
        async with cls._lock:
            if system not in cls._context or not cls._is_context_valid(system):
                await cls._ensure_browser(system, headless=headless)
            return cls._context[system]

    @classmethod
    def _is_context_valid(cls, system: str) -> bool:
        try:
            if system not in cls._context or cls._context[system] is None:
                return False
            if not cls._context[system].browser.is_connected():
                return False
            return True
        except Exception:
            return False

    # @classmethod
    # async def _ensure_browser(cls, system: str = None):
    #     if cls._browser is None:
    #         if cls._playwright is None:
    #             cls._playwright = await async_playwright().start()
    #         try:
    #             cls._browser = await cls._playwright.chromium.launch(
    #                 headless=False,
    #                 channel="chrome",
    #                 args=[
    #                     '--disable-blink-features=AutomationControlled',
    #                     '--no-sandbox',
    #                     '--disable-dev-shm-usage',
    #                     '--disable-gpu',
    #                     '--disable-web-security',
    #                     '--disable-features=IsolateOrigins,site-per-process,TranslateUI',
    #                     '--disable-accelerated-2d-canvas',
    #                     '--disable-background-timer-throttling',
    #                     '--disable-backgrounding-occluded-windows',
    #                     '--disable-breakpad',
    #                     '--disable-component-extensions-with-background-pages',
    #                     '--disable-domain-reliability',
    #                     '--disable-extensions',
    #                     '--disable-features=AudioServiceOutOfProcess',
    #                     '--disable-hang-monitor',
    #                     '--disable-ipc-flooding-protection',
    #                     '--disable-notifications',
    #                     '--disable-renderer-backgrounding',
    #                     '--disable-background-networking',
    #                     '--enable-features=NetworkService,NetworkServiceInProcess',
    #                     '--disable-client-side-phishing-detection',
    #                     '--disable-default-apps',
    #                     '--disable-dev-shm-usage',
    #                     '--no-first-run',
    #                     '--no-default-browser-check',
    #                     '--password-store=basic',
    #                     '--use-mock-keychain',
    #                     '--hide-scrollbars',
    #                     '--mute-audio',
    #                     '--disable-bundled-ppapi-flash',
    #                     '--disable-software-rasterizer',
    #                     '--disable-features=VizDisplayCompositor',
    #                     '--disable-automation-controller',
    #                     '--disable-component-update',
    #                     '--disable-background-downloads',
    #                     '--disable-sync',
    #                     '--metrics-recording-only',
    #                     '--disable-default-apps',
    #                     '--disable-prerender-local-predictor',
    #                     '--disable-translate',
    #                     '--disable-offer-store-unmasked-wallet-cards',
    #                     '--disable-offer-upload-credit-cards',
    #                     '--disable-print-preview',
    #                     '--disable-prompt-on-repost',
    #                     '--disable-domain-reliability',
    #                     '--disable-speech-api',
    #                     '--disable-media-session-api',
    #                     '--disable-background-timer-throttling',
    #                     '--disable-renderer-backgrounding',
    #                     '--disable-features=UserAgentClientHint',
    #                     '--disable-features=InterestCohort',
    #                     '--disable-features=FedCm',
    #                     '--disable-features=DigitalGoods',
    #                     '--disable-features=MediaRouter',
    #                     '--disable-features=OptimizationHints',
    #                     '--disable-features=MediaRouter',
    #                 ],
    #                 ignore_default_args=['--enable-automation']
    #             )
    #         except Exception as e:
    #             print(f"启动浏览器失败: {e}")
    #             raise
    #
    #     width, height = get_screen_size()
    #     storage_path = os.path.abspath(get_storage_state_path(system))
    #     user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    #     if os.path.exists(storage_path):
    #         cls._context[system] = await cls._browser.new_context(
    #             storage_state=storage_path,
    #             user_agent=user_agent,
    #             viewport={"width": width, "height": height}
    #         )
    #         print(f"已加载登录状态: {storage_path}")
    #     else:
    #         cls._context[system] = await cls._browser.new_context(
    #             user_agent=user_agent,
    #             viewport={"width": width, "height": height}
    #         )
    #         print("未找到登录状态，请先登录")

    @classmethod
    async def new_tab(cls, system: str = None, headless: bool = False) -> Page:
        context = await cls.get_context(system=system, headless=headless)
        
        page = await context.new_page()
        if system not in cls._pages:
            cls._pages[system] = []
        cls._pages[system].append(page)

        await Stealth(
            # 基本伪装
            navigator_webdriver=True,  # 隐藏webdriver属性
            navigator_languages=True,
            navigator_platform=True,
            navigator_platform_override='Win32',
            # WebGL指纹
            webgl_vendor=True,
            webgl_vendor_override='Intel Inc.',
            webgl_renderer_override='Intel Iris OpenGL Engine',
            # 禁用可能被检测的脚本
            chrome_app=False,
            chrome_csi=False,
            chrome_load_times=False,
            chrome_runtime=False,
            hairline=False,  # 可能被检测
            iframe_content_window=False,  # 可能被检测
            media_codecs=False,  # 可能被检测
            navigator_hardware_concurrency=False,  # 可能被检测
            navigator_permissions=False,  # 可能被检测
            navigator_plugins=False,  # 可能被检测
            error_prototype=True,  # 保持启用
            sec_ch_ua=False,  # 禁用，因为我们已经手动设置HTTP头
            # 其他设置
            navigator_user_agent=False,  # 禁用，使用我们的UA
            navigator_vendor=False,  # 禁用
        ).apply_stealth_async(page)  # 应用 stealth 技术

        print(f"新标签页已打开")
        return page

    @classmethod
    async def close_page(cls, page: Page):
        try:
            # pages_count = len(cls._pages)
            # if pages_count <= 1:
            #     print("保留最后一个标签页，不关闭浏览器")
            #     return
            # if pages_count == 2:
            #     first_page = cls._pages[0]
            #     is_blank = await cls._is_blank_page(first_page)
            #     if is_blank:
            #         print("保留最后一个标签页，不关闭浏览器")
            #         return
            for pages in cls._pages.values():
                if page in pages:
                    pages.remove(page)
                    break
            await page.close()
            print("标签页已关闭")
        except Exception as e:
            print(f"关闭标签页异常: {e}")

    @classmethod
    async def _is_blank_page(cls, page: Page) -> bool:
        try:
            if page.url == "about:blank" or page.url == "":
                return True
            return False
        except Exception:
            return False

    @classmethod
    async def close_all_pages(cls):
        for pages in cls._pages.values():
            for page in pages[:]:
                try:
                    await page.close()
                except Exception:
                    pass
        cls._pages.clear()

    @classmethod
    async def stop_by_system(cls, system: str):
        async with cls._lock:
            if system in cls._context:
                try:
                    await cls._context[system].close()
                except Exception:
                    pass
                del cls._context[system]
            if system in cls._pages:
                for page in cls._pages[system][:]:
                    try:
                        await page.close()
                    except Exception:
                        pass
                del cls._pages[system]

    @classmethod
    async def stop(cls):
        async with cls._lock:
            for ctx in cls._context.values():
                try:
                    await ctx.close()
                except Exception:
                    pass
            try:
                if cls._browser:
                    await cls._browser.close()
            except Exception:
                pass
            try:
                if cls._playwright:
                    await cls._playwright.stop()
            except Exception:
                pass
            cls._browser = None
            cls._context = {}
            cls._playwright = None
            cls._pages = {}

    @classmethod
    async def save_storage_state(cls, context: BrowserContext, storage_path: str = None):
        if storage_path is None:
            storage_path = get_storage_state_path("jimeng")
        storage_path = os.path.abspath(storage_path)
        await context.storage_state(path=storage_path)

    async def new_page(self, system: str = None, headless: bool = False) -> Page:
        return await self.new_tab(system=system, headless=headless)

    async def start(self):
        await self.get_context()


browser_manager = BrowserManager()