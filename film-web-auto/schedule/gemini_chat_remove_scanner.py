import asyncio

from browser.manager import browser_manager
from core.config import settings
from database.connection import AsyncSessionLocal
from pages.gemini import GeminiPage
from services.gemini.remove_chat import GeminiRemoveChat
from services.client_request_service import ClientRequestService
from utils.browser import scroll_element_to_top


class GeminiChatRemoveScannerService:
    _is_running: bool = False

    async def start(self):
        while True:
            if GeminiChatRemoveScannerService._is_running:
                print("[GeminiChatRemoveScanner] Previous scan still running, skipping this cycle...")
                await asyncio.sleep(settings.GEMINI_CHAT_REMOVE_SCANNER_INTERVAL)
                continue

            GeminiChatRemoveScannerService._is_running = True
            try:
                await self._scan_once()
            except Exception as e:
                print(f"[GeminiChatRemoveScanner] Scan error: {e}")
            finally:
                GeminiChatRemoveScannerService._is_running = False
            await asyncio.sleep(settings.GEMINI_CHAT_REMOVE_SCANNER_INTERVAL)

    async def _scan_once(self):
        async with AsyncSessionLocal() as session:
            client_request_service = ClientRequestService(session)
            pending_requests = await client_request_service.get_pending_chat_delete(
                reserved_quantity=settings.GEMINI_CHAT_REMOVE_SCANNER_RESERVED_QUANTITY,
                reserved_time_length=settings.GEMINI_CHAT_REMOVE_SCANNER_RESERVED_TIME_LENGTH
            )
            print(f"[GeminiChatRemoveScanner] Found {len(pending_requests)} pending chat delete requests")

        if not pending_requests:
            return

        page = None
        if page:
            await browser_manager.close_page(page)
        page = await browser_manager.new_page(system="gemini", headless=settings.BROWSER_HEADLESS)
        url = f"{settings.GEMINI_URL}"
        gemini = GeminiPage(page, url=url)
        await gemini.navigate_async()
        await page.wait_for_timeout(3000)

        if not await gemini._is_logged_in():
            print("[GeminiChatRemoveScanner] Not logged in, skipping this cycle")
            return

        await gemini.navigate()

        await self._scroll(page)

        try:
            async with AsyncSessionLocal() as session:
                client_request_service = ClientRequestService(session)
                for request in pending_requests:
                    await self._process_gemini(page, request.workspace, client_request_service, request.id)
                await session.commit()
        except Exception as e:
            await session.rollback()
            print(f"[GeminiChatRemoveScanner] Error: {e}")
        finally:
            if page:
                await browser_manager.close_page(page)

    async def _scroll(self, page):
        container = page.locator("side-navigation-content infinite-scroller")
        if await container.count() == 0:
            print("[GeminiRemoveChat] Container not found")
            return

        await container.hover()
        await asyncio.sleep(0.5)

        scroll_distance = 600
        while True:
            scroll_top = await page.evaluate(
                """() => {
                    const el = document.querySelector('side-navigation-content infinite-scroller');
                    return el ? el.scrollTop : 0;
                }"""
            )
            await page.mouse.wheel(0, scroll_distance)
            await asyncio.sleep(1)
            new_scroll_top = await page.evaluate(
                """() => {
                    const el = document.querySelector('side-navigation-content infinite-scroller');
                    return el ? el.scrollTop : 0;
                }"""
            )
            if scroll_top == new_scroll_top:
                break
            scroll_top = new_scroll_top

        await scroll_element_to_top(page, "side-navigation-content infinite-scroller")

    async def _process_gemini(self, page, workspace, client_request_service=None, request_id=None):
        await GeminiRemoveChat.remove(page, workspace, client_request_service, request_id)


gemini_chat_remove_scanner_service = GeminiChatRemoveScannerService()