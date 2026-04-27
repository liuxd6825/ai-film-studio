from browser import browser_manager
from .base import BasePage
from core.config import settings
import time


LOGIN_CHECK_INTERVAL = 3
LOGIN_TIMEOUT = 1800


def escape_for_js(text: str) -> str:
    if not text:
        return text
    trans = str.maketrans({
        "\\": "\\\\",
        "'": "\\'",
        "\n": "\\n",
        "\r": "\\r",
        "\t": "\\t",
        "\b": "\\b",
        "\f": "\\f",
        "`": "\\`",
    })
    return text.translate(trans)


class GeminiPage(BasePage):
    def __init__(self, page, url: str = settings.GEMINI_URL):
        super().__init__(page, url)

    async def _load_page(self, headless: bool = False):
        page = await browser_manager.new_page(system="gemini", headless=headless)
        self.page = page
        await self.navigate_async()

    async def wait_for_page_ready(self):
        print("[GeminiPage] 等待页面加载...")
        await self.page.wait_for_load_state("load", timeout=settings.TASK_TIMEOUT)
        await self.page.wait_for_timeout(2000)
        try:
            await self.page.wait_for_selector("textarea, [contenteditable='true']", timeout=15000)
            print("[GeminiPage] 页面已加载完成")
        except Exception:
            print("[GeminiPage] 警告: 未能找到输入元素")

    async def _is_logged_in(self) -> bool:
        try:
            account_link = self.page.locator("a[aria-label^='Google 账号：'][href^='https://accounts.google.com/SignOutOptions'][role='button']")
            if await account_link.count() > 0 and await account_link.first.is_visible():
                print("[GeminiPage] 检测到账号登录元素")
                return True
        except Exception as e:
            print(f"[GeminiPage] 检查账号登录元素异常: {e}")
        return False

    async def _click_login_button(self):
        login_btn = self.page.locator("a[aria-label='登录'][href^='https://accounts.google.com/ServiceLogin']")
        if await login_btn.count() > 0:
            try:
                await login_btn.first.click(force=True)
                return True
            except Exception:
                pass
        return False

    async def wait_for_login(self, timeout: int = LOGIN_TIMEOUT):
        await self.wait_for_page_ready()

        print("[GeminiPage] 检查登录状态...")
        clicked_login = False
        start_time = time.time()

        while True:
            elapsed = time.time() - start_time
            if elapsed > timeout:
                print(f"[GeminiPage] 登录超时 ({timeout}s)")
                return False

            if await self._is_logged_in():
                print(f"[GeminiPage] 已登录!")
                # print("[GeminiPage] 保存登录信息...")
                # storage_path = os.path.abspath(get_storage_state_path("gemini"))
                # await self.page.context.storage_state(path=storage_path)
                # print(f"[GeminiPage] 登录信息已保存到: {storage_path}")
                return True

            if not clicked_login:
                print(f"[GeminiPage] 检测到未登录，点击登录按钮...")
                await self._click_login_button()
                clicked_login = True
                print(f"[GeminiPage] 等待扫码登录...")

            await self.page.wait_for_timeout(LOGIN_CHECK_INTERVAL * 1000)

    async def wait_for_login_v2(self,headless: bool=False, timeout: int = LOGIN_TIMEOUT):
        await self._load_page(headless=headless)
        await self.wait_for_page_ready()

        print("[JimengPage] 检查登录状态...")
        clicked_login = False
        start_time = time.time()

        while True:
            elapsed = time.time() - start_time
            if elapsed > timeout:
                print(f"[JimengPage] 登录超时 ({timeout}s)")
                return False

            if await self._is_logged_in():
                print(f"[JimengPage] 已登录!")
                if not clicked_login:
                    return True
                else:
                    await browser_manager.stop_by_system(system="gemini")
                    return await self.wait_for_login_v2(True)

            if not clicked_login:
                if headless:
                    await browser_manager.stop_by_system(system="gemini")
                    return await self.wait_for_login_v2(False)

                print(f"[JimengPage] 检测到未登录，点击登录按钮...")
                await self._click_login_button()
                clicked_login = True
                print(f"[JimengPage] 等待扫码登录...")

            await self.page.wait_for_timeout(LOGIN_CHECK_INTERVAL * 1000)

    async def select_image_generation_tool(self, model: str = "制作图片"):
        print(f"[GeminiPage] 选择图片生成工具: {model}...")
        toolbox_drawer = self.page.locator("toolbox-drawer")
        if await toolbox_drawer.count() > 0:
            await toolbox_drawer.first.click()
            await self.page.wait_for_timeout(1000)

            toolbox_items = self.page.locator("toolbox-drawer-item")
            item_count = await toolbox_items.count()
            print(f"[GeminiPage] 找到 {item_count} 个 toolbox-drawer-item 元素")

            for i in range(item_count):
                item = toolbox_items.nth(i)
                text = await item.text_content() or ""
                print(f"[GeminiPage] toolbox-drawer-item[{i}] 文本: {text.strip()}")
                if model in text:
                    await item.click()
                    await self.page.wait_for_timeout(500)
                    print(f"[GeminiPage] 已选中工具: {text.strip()}")
                    return True

        print(f"[GeminiPage] 未找到包含 '{model}' 的工具")
        return False

    async def click_upload_button(self):
        print("[GeminiPage] 点击上传按钮...")
        uploader = self.page.locator("uploader")
        if await uploader.count() > 0:
            upload_btn = uploader.locator("button").first
            if await upload_btn.count() > 0:
                is_vis = await upload_btn.is_visible()
                if is_vis:
                    await upload_btn.click()
                    await self.page.wait_for_timeout(1000)
                    print("[GeminiPage] 已点击 uploader 按钮")

        images_uploader = self.page.locator("images-files-uploader")
        if await images_uploader.count() > 0:
            is_vis = await images_uploader.first.is_visible()
            if is_vis:
                await images_uploader.first.click()
                await self.page.wait_for_timeout(1000)
                print("[GeminiPage] 已点击 images-files-uploader")
                return True

        print("[GeminiPage] 未找到 images-files-uploader")
        return False

    async def upload_files(self, file_paths: list[str]):
        print(f"[GeminiPage] 开始上传 {len(file_paths)} 个文件...")
        for i, path in enumerate(file_paths):
            print(f"[GeminiPage] 上传文件 {i+1}: {path}")

            async with self.page.expect_file_chooser() as fc_info:
                await self.click_upload_button()

            file_chooser = await fc_info.value
            await file_chooser.set_files(path)
            await self.page.wait_for_timeout(1500)
            print(f"[GeminiPage] 文件 {i+1} 上传完成")

        await self.page.keyboard.press("Escape")
        await self.page.wait_for_timeout(500)

    async def input_prompt(self, prompt: str):
        print(f"[GeminiPage] 填写提示词: {prompt[:50]}...")

        editable = self.page.locator("[contenteditable='true']").first
        if await editable.count() > 0 and await editable.is_visible():
            await editable.click()
            await self.page.wait_for_timeout(200)
            escaped_prompt = escape_for_js(prompt)
            await self.page.evaluate(f"""
                () => {{
                    const editables = document.querySelectorAll('[contenteditable="true"]');
                    if (editables[0]) {{
                        editables[0].textContent = '';
                        editables[0].textContent = '{escaped_prompt}';
                        editables[0].dispatchEvent(new Event('input', {{ bubbles: true }}));
                        editables[0].dispatchEvent(new Event('change', {{ bubbles: true }}));
                    }}
                }}
            """)
            await self.page.wait_for_timeout(1000)
            print("[GeminiPage] 提示词已填写到 contenteditable")
            return

        textarea_input = self.page.locator("textarea").first
        if await textarea_input.count() > 0 and await textarea_input.is_visible():
            await textarea_input.fill(prompt)
            await self.page.wait_for_timeout(1000)
            print("[GeminiPage] 提示词已填写到 textarea")
            return

        raise RuntimeError("[GeminiPage]未找到提示词文本框")

    async def submit(self):
        await self.page.wait_for_timeout(1000)
        print("[GeminiPage] 提交请求...")
        count = 0
        while True:
            send_btn = self.page.locator("button[aria-label='发送'][aria-disabled='false']").first
            if await send_btn.count() == 0:
                count = count + 1
                if count > 20:
                    break
                print(f"[GeminiPage] 警告: 第 {count} 次未找到发送按钮")
                await self.page.wait_for_timeout(1000)
                continue
            else:
                await send_btn.click(force=True)
                print("[GeminiPage] 已点击发送按钮")
                return

        raise RuntimeError("未找到发送按钮")

    async def wait_for_generation_complete(self, timeout: int = 60000) -> dict:
        print("[GeminiPage] 等待生成完成...")
        await self.page.wait_for_timeout(1000)

        pending_count = 0
        while pending_count <= 20:
            pending = self.page.locator("pending-request")
            if await pending.count() > 0:
                pending_count += 1
                print(f"[GeminiPage] 检测到 pending-request ({pending_count}/20)，继续等待...")
                if pending_count > 20:
                    return {
                        "data_id": "",
                        "workspace": "",
                        "status": "failed",
                        "message": "生成超时"
                    }
                await self.page.wait_for_timeout(1000)
                continue

            pending_count = 0
            await self.page.wait_for_timeout(1000)

            while True:
                processing = self.page.locator("processing-state")
                if await processing.count() > 0:
                    is_hidden = await processing.first.get_attribute("hidden")
                    if is_hidden is None:
                        await self.page.wait_for_timeout(1000)
                        continue
                break

            data_id = await self.page.evaluate("""
                () => {
                    const scroller = document.querySelector("infinite-scroller[data-test-id='chat-history-container']");
                    if (scroller && scroller.children.length > 0) {
                        const lastChild = scroller.children[scroller.children.length - 1];
                        return lastChild.id || "";
                    }
                    return "";
                }
            """)

            url = self.page.url
            workspace = url.rsplit("/", 1)[-1] if "/" in url else ""

            if workspace and len(workspace) == 16 and "?" not in workspace:
                print(f"[GeminiPage] 获取到 workspace: {workspace}")
                return {
                    "data_id": data_id,
                    "workspace": workspace,
                    "status": "generating",
                    "message": "内容生成中"
                }
            else:
                return {
                    "data_id": "",
                    "workspace": "",
                    "status": "failed",
                    "message": "没有找到workspace"
                }

        return {
            "data_id": "",
            "workspace": "",
            "status": "failed",
            "message": "生成超时"
        }

    async def navigate(self):
        if self.page.url != self.url:
            print(f"[GeminiPage] 导航到 {self.url}")
            await self.page.goto(self.url, timeout=settings.TASK_TIMEOUT)
            await self.page.wait_for_load_state("domcontentloaded", timeout=settings.TASK_TIMEOUT)

    async def navigate_async(self):
        print(f"[GeminiPage] 异步导航到 {self.url}")
        await self.page.goto(self.url, timeout=settings.TASK_TIMEOUT)
        await self.page.wait_for_load_state("load", timeout=settings.TASK_TIMEOUT)
        print("[GeminiPage] 页面加载完成，等待 3 秒...")
        await self.page.wait_for_timeout(3000)
