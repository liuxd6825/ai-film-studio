import asyncio

from browser.manager import browser_manager
from core.config import settings
from database.connection import AsyncSessionLocal
from pages.gemini import GeminiPage
from services.client_request_service import ClientRequestService
from utils.browser import scroll_element_to_top


class GeminiRemoveChat:
    @staticmethod
    async def remove(page, workspace: str = None, client_request_service=None, request_id: str = None):
        try:
            item = page.locator(f"side-navigation-content infinite-scroller conversations-list div[role='region']>div a[href='/app/{workspace}']")
            count = await item.count()
            if count == 0:
                print(f"[GeminiRemoveChat] No remove item found, workspace={workspace}")
                return

            conv = item.locator('..')

            try:
                await conv.scroll_into_view_if_needed()
                await asyncio.sleep(0.3)
                await conv.hover()
                await asyncio.sleep(0.3)
                action_btn = conv.locator("button[data-test-id='actions-menu-button']")
                await action_btn.click(timeout=5000)
                await asyncio.sleep(1)

                aria_controls = await action_btn.get_attribute("aria-controls")
                if not aria_controls:
                    print(f"[GeminiRemoveChat] aria-controls not found, workspace={workspace}")
                    return

                delete_btn = page.locator(f"#{aria_controls} button[data-test-id='delete-button']")
                if await delete_btn.count() > 0:
                    await delete_btn.click(timeout=5000)
                    await asyncio.sleep(1)
                    print(f"[GeminiRemoveChat] Deleted item, workspace={workspace}")

                    confirm_btn = page.locator("mat-dialog-actions button[data-test-id='confirm-button']")
                    if await confirm_btn.count() > 0:
                        await confirm_btn.click(timeout=5000)
                        await asyncio.sleep(1)
                        print(f"[GeminiRemoveChat] Confirmed deletion, workspace={workspace}")

                        if client_request_service and request_id:
                            await client_request_service.update_client_request(request_id, {"chat_deleted": True})
                else:
                    print(f"[GeminiRemoveChat] Delete button not found for aria-controls: {aria_controls}, workspace={workspace}")
            except Exception as e:
                print(f"[GeminiRemoveChat] Error deleting item, workspace={workspace}, error: {e}")

        except Exception as e:
            print(f"[GeminiRemoveChat] workspace={workspace}, Error: {e}")

    @staticmethod
    async def remove_chats(reserved_quantity: int = None, reserved_time_length: int = None):
        async with AsyncSessionLocal() as session:
            client_request_service = ClientRequestService(session)
            pending_requests = await client_request_service.get_pending_chat_delete2(
                reserved_quantity=reserved_quantity,
                reserved_time_length=reserved_time_length
            )
            print(f"[GeminiRemoveChat] Found {len(pending_requests)} pending chat delete requests")

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
            print("[GeminiRemoveChat] Not logged in, skipping this cycle")
            return

        await gemini.navigate()

        await GeminiRemoveChat._scroll(page)

        try:
            async with AsyncSessionLocal() as session:
                client_request_service = ClientRequestService(session)
                for request in pending_requests:
                    await GeminiRemoveChat.remove(page, request.workspace, client_request_service, request.id)
                await session.commit()
        except Exception as e:
            await session.rollback()
            print(f"[GeminiRemoveChat] Error: {e}")
        finally:
            if page:
                await browser_manager.close_page(page)

    @staticmethod
    async def _scroll(page):
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