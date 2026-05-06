from .base import BasePage
from core.config import settings
from browser.manager import get_storage_state_path, browser_manager
import os
import uuid
from pathlib import Path
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
        "\v": "\\v",
        "`": "\\`",
    })
    return text.translate(trans)

class JimengPage(BasePage):
    def __init__(self, page = None, workspace: str = "0"):
        url = f"{settings.JIMENG_URL}?workspace={workspace}"
        super().__init__(page, url)

    async def _load_page(self, headless: bool = False):
        page = await browser_manager.new_page(system="jimeng", headless=headless)
        self.page = page
        await self.navigate_async()
    
    async def wait_for_page_ready(self):
        print("[JimengPage] 等待页面加载...")
        await self.page.wait_for_load_state("load", timeout=settings.TASK_TIMEOUT)
        await self.page.wait_for_timeout(1000)
        try:
            await self.page.wait_for_selector(".toolbar-CO0C5P", timeout=15000)
            print("[JimengPage] 页面已加载完成")
        except Exception:
            print("[JimengPage] 警告: 未能找到 toolbar 元素")
    
    async def _close_any_open_dropdown(self):
        await self.page.evaluate("""
            () => {
                const popups = document.querySelectorAll('.lv-select-popup');
                popups.forEach(p => p.remove());
            }
        """)
        await self.page.keyboard.press("Escape")
        await self.page.wait_for_timeout(300)
    
    async def _is_logged_in(self) -> bool:
        personal = self.page.locator("#Personal")
        login_btn = self.page.locator("#SiderMenuLogin > div > div")
        has_personal = await personal.count() > 0
        has_login_btn = await login_btn.count() > 0
        personal_has_children = await personal.evaluate("el => el.children.length > 0") if has_personal else False
        return has_personal and personal_has_children and not has_login_btn
    
    async def _get_current_mode(self) -> str:
        mode_select = self.page.locator(".lv-select.toolbar-select-rZZr1T").first
        if await mode_select.count() > 0:
            text = await mode_select.text_content()
            if text:
                return text.strip()
        return ""
    
    async def _click_login_button(self):
        login_btn = self.page.locator("#SiderMenuLogin > div > div")
        if await login_btn.count() > 0:
            try:
                await login_btn.first.click(force=True)
                return True
            except Exception:
                pass
        return False
    
    async def wait_for_login(self, timeout: int = LOGIN_TIMEOUT):
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
                # print("[JimengPage] 保存登录信息...")
                # storage_path = os.path.abspath(get_storage_state_path("jimeng"))
                # await self.page.context.storage_state(path=storage_path)
                # print(f"[JimengPage] 登录信息已保存到: {storage_path}")
                return True
            
            if not clicked_login:
                print(f"[JimengPage] 检测到未登录，点击登录按钮...")
                await self._click_login_button()
                clicked_login = True
                print(f"[JimengPage] 等待扫码登录...")
            
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
                    await browser_manager.stop_by_system(system="jimeng")
                    return await self.wait_for_login_v2(True)

            if not clicked_login:
                if headless:
                    await browser_manager.stop_by_system(system="jimeng")
                    return await self.wait_for_login_v2(False)

                print(f"[JimengPage] 检测到未登录，点击登录按钮...")
                await self._click_login_button()
                clicked_login = True
                print(f"[JimengPage] 等待扫码登录...")

            await self.page.wait_for_timeout(LOGIN_CHECK_INTERVAL * 1000)
    
    async def _select_dropdown_option(self, mode_text: str):
        await self._close_any_open_dropdown()
        await self.page.wait_for_timeout(200)
        
        await self.page.locator(".lv-select.toolbar-select-rZZr1T").first.click(force=True)
        await self.page.wait_for_timeout(500)
        
        await self.page.locator(".lv-select-option").filter(has_text=mode_text).first.click(force=True)
        
        await self.page.wait_for_timeout(500)
        await self._close_any_open_dropdown()
    
    async def select_generation_mode(self, mode: str):
        try:
            current = await self._get_current_mode()
            if current == mode:
                print(f"[JimengPage] 当前模式已是: {mode}，无需切换")
                return
            
            print(f"[JimengPage] 当前模式: {current}，切换到: {mode}")
            await self._select_dropdown_option(mode)
        except Exception as e:
            print(f"Error in select_generation_mode: {e}")
            await self._close_any_open_dropdown()
    
    async def select_model(self, model: str):
        await self._close_any_open_dropdown()
        
        all_selects = await self.page.locator(".toolbar-settings-_tX5sB .lv-select").all()
        if len(all_selects) <= 1:
            model_selector = all_selects[0] if all_selects else None
        else:
            model_selector = all_selects[1]
        
        if not model_selector:
            return
        
        await model_selector.click(force=True)
        await self.page.wait_for_timeout(2000)
        
        try:
            await self.page.wait_for_selector(".lv-select-option", timeout=5000)
        except Exception:
            pass
        
        model_option = self.page.locator(".lv-select-option").filter(has_text=model)
        if await model_option.count() > 0:
            await model_option.first.click(force=True)
        
        await self.page.wait_for_timeout(500)
        await self._close_any_open_dropdown()
    
    async def select_model_v2(self, model: str):
        await self._close_any_open_dropdown()
        await self.page.wait_for_timeout(500)
        
        model_select = self.page.locator("#dreamina-ui-configuration-content-wrapper .lv-select").nth(1)
        if await model_select.count() > 0:
            await model_select.click(force=True)
            await self.page.wait_for_timeout(1000)
            
            trigger_spans = await self.page.locator("span[class*='lv-trigger']").all()
            
            exact_match_opt = None
            fuzzy_match_opt = None
            
            for span in trigger_spans:
                span_text = await span.text_content() or ""
                if "选择模型" not in span_text:
                    continue
                
                options = await span.locator(".lv-select-option").all()
                for opt in options:
                    lv_typography_elements = await opt.locator(":scope > .lv-typography").all()
                    for el in lv_typography_elements:
                        await el.evaluate("el => el.remove()")
                    
                    opt_text = await opt.text_content()
                    if opt_text:
                        opt_text_clean = opt_text.strip().lower()
                        model_clean = model.strip().lower()
                        
                        if opt_text_clean == model_clean:
                            exact_match_opt = opt
                            break
                        elif model_clean in opt_text_clean:
                            fuzzy_match_opt = opt
                
                if exact_match_opt:
                    break
            
            target_opt = exact_match_opt or fuzzy_match_opt
            if target_opt:
                await target_opt.click(force=True)
                await self.page.wait_for_timeout(500)
                await self._close_any_open_dropdown()
                return
            
            print(f"[JimengPage] select_model_v2: 未找到包含 '{model}' 的选项")
        
        await self._close_any_open_dropdown()
    
    async def select_reference_type(self, ref_type: str):
        await self.page.evaluate("""
            () => {
                const popups = document.querySelectorAll('.lv-select-popup');
                popups.forEach(p => p.remove());
            }
        """)
        await self.page.wait_for_timeout(300)
        
        feature_select = self.page.locator(".feature-select-LagwpK")
        if await feature_select.count() > 0:
            await feature_select.first.click(force=True)
            await self.page.wait_for_timeout(1000)
            
            trigger_spans = await self.page.locator("span[class*='lv-trigger']").all()
            target_opt = None
            
            for span in trigger_spans:
                span_text = await span.text_content() or ""
                if "选择模型" in span_text:
                    continue
                
                options = await span.locator(".lv-select-option").all()
                for opt in options:
                    lv_typography_elements = await opt.locator(":scope > .lv-typography").all()
                    for el in lv_typography_elements:
                        await el.evaluate("el => el.remove()")
                    
                    opt_text = await opt.text_content()
                    if opt_text and ref_type in opt_text:
                        target_opt = opt
                        break
                
                if target_opt:
                    break
            
            if target_opt:
                await target_opt.click(force=True)
            await self.page.wait_for_timeout(500)
    
    async def upload_reference_images(self, file_paths: list[str]):
        for path in file_paths:
            file_input = self.page.locator(".references-F9DFuS input[type='file']")
            if await file_input.count() > 0:
                await file_input.first.set_input_files(path)
            else:
                upload_btn = self.page.locator(".reference-upload-Iq2Aoa")
                if await upload_btn.count() > 0:
                    await upload_btn.first.click()
                    await self.page.wait_for_timeout(300)
                    file_input = self.page.locator(".references-F9DFuS input[type='file']")
                    if await file_input.count() > 0:
                        await file_input.first.set_input_files(path)
            await self.page.wait_for_timeout(500)
    
    async def input_prompt(self, prompt: str):
        editor = self.page.locator(".prompt-editor-ZsQbxJ .tiptap.ProseMirror").first
        if await editor.count() > 0:
            await editor.click()
            await self.page.wait_for_timeout(100)
            escaped_prompt = escape_for_js(prompt)
            await self.page.evaluate(f"""
                () => {{
                    const editors = document.querySelectorAll('.tiptap.ProseMirror');
                    if (editors[0]) {{
                        editors[0].textContent = '';
                        editors[0].textContent = '{escaped_prompt}';
                        editors[0].dispatchEvent(new Event('input', {{ bubbles: true }}));
                        editors[0].dispatchEvent(new Event('change', {{ bubbles: true }}));
                    }}
                }}
            """)
        else:
            textarea = self.page.locator(".prompt-editor-ZsQbxJ textarea")
            if await textarea.count() > 0:
                await textarea.first.fill(prompt)
    
    async def open_settings_dialog(self):
        await self._close_any_open_dropdown()
        settings = self.page.locator(".toolbar-CO0C5P .container-_WJSyE.toolbar-settings-_tX5sB > div")
        if await settings.count() > 0:
            await settings.first.click(force=True)
            await self.page.wait_for_timeout(500)
    
    async def open_settings_popup(self):
        await self._close_any_open_dropdown()
        settings_btn = self.page.locator(".toolbar-settings-_tX5sB button")
        if await settings_btn.count() > 0:
            await settings_btn.first.click(force=True)
            await self.page.wait_for_timeout(2000)
    
    async def select_aspect_ratio(self, ratio: str):
        if not ratio:
            return
        
        await self.page.wait_for_timeout(1000)
        
        normalized = ratio.lower()
        
        all_radios = await self.page.locator("div.lv-radio-group:not([class*='resolution-radio-group-']):not([class*=' resolution-radio-group-']) > label").all()
        for radio in all_radios:
            text = await radio.text_content()
            if text and normalized in text.lower():
                await radio.click(force=True)
                await self.page.wait_for_timeout(500)
                return
        
        print(f"[JimengPage] select_aspect_ratio: 未找到包含 '{ratio}' 的选项")
    
    async def select_resolution(self, resolution: str):
        if not resolution:
            return
        
        await self.page.wait_for_timeout(1000)
        
        normalized = resolution.lower()
        
        all_radios = await self.page.locator("div[class*='resolution-radio-group-']>label.lv-radio,div[class*=' resolution-radio-group-']>label.lv-radio").all()
        for radio in all_radios:
            text = await radio.text_content()
            if text and normalized in text.lower():
                await radio.click(force=True)
                await self.page.wait_for_timeout(500)
                return
        
        print(f"[JimengPage] select_resolution: 未找到包含 '{resolution}' 的选项")
    
    async def set_dimensions(self, width: int = None, height: int = None):
        if not await self.page.locator("#dreamina-ui-configuration-content-wrapper").count() > 0:
            await self.open_settings_popup()
        
        if width is not None:
            width_input = self.page.locator(".lv-input[placeholder='请输入']").first
            if await width_input.count() > 0:
                await width_input.fill(str(width))
                await self.page.wait_for_timeout(300)
        
        if height is not None:
            all_inputs = await self.page.locator(".lv-input[placeholder='请输入']").all()
            if len(all_inputs) > 1:
                await all_inputs[1].fill(str(height))
                await self.page.wait_for_timeout(300)
    
    async def close_dialog(self):
        await self._close_any_open_dropdown()
    
    async def submit(self):
        submit_btn = self.page.locator(".toolbar-actions-KjbR4x button.lv-btn-primary")
        if await submit_btn.count() > 0:
            disabled = await submit_btn.first.get_attribute("disabled")
            if disabled is None:
                await submit_btn.first.click(force=True)
            else:
                submit_btn = self.page.locator(".toolbar-actions-KjbR4x button").last
                await submit_btn.click(force=True)
    
    async def wait_for_generation_complete(self, timeout: int = 60000) -> dict:
        await self.page.wait_for_timeout(1000)
        
        download_urls = []
        file_names = []
        target_div = self.page.locator("div[data-id][data-index='0']")
        
        while True:
            if await target_div.count() > 0:
                text = await target_div.text_content() or ""
                if "智能创意中" in text or "造梦中" in text:
                    await self.page.wait_for_timeout(1000)
                    continue
            
            image_items = target_div.locator("div[class*='image-record-item-']")
            item_count = await image_items.count()
            
            for i in range(item_count):
                item = image_items.nth(i)
                await item.hover()
                await self.page.wait_for_timeout(200)
                
                op_btn = item.locator("div[class*='operation-button-']")
                if await op_btn.count() > 0:
                    async with self.page.expect_download(timeout=timeout) as download_info:
                        await op_btn.first.click(force=True)
                    
                    download = await download_info.value
                    filename = download.suggested_filename or f"{uuid.uuid4()}.tmp"
                    filepath = os.path.join(settings.DOWNLOAD_CACHE_DIR, filename)
                    Path(filepath).parent.mkdir(parents=True, exist_ok=True)
                    await download.save_as(filepath)
                    file_names.append(filename)
                    file_url = f"{settings.DOWNLOAD_URL_PREFIX}/downloads/{filename}"
                    download_urls.append(file_url)

                    print(f"[JimengPage] 下载完成: {file_url}")
            
            break
        
        # await self.page.wait_for_timeout(500)
        item_id = await target_div.get_attribute("id") if await target_div.count() > 0 else ""
        data_id = await target_div.get_attribute("data-id") if await target_div.count() > 0 else ""
        return {
            "item_id": item_id,
            "data_id": data_id,
            "status": "completed",
            "message": "生成成功",
            "file_names": file_names,
            "download_urls": download_urls
        }

    async def wait_for_generation_complete_v2(self, timeout: int = 10000) -> dict:
        await self.page.wait_for_timeout(1000)
        
        target_div = self.page.locator("div[data-id][data-index='0']")
        waiting_texts = ["智能创意中", "造梦中", "排队加速中", "排队中"]
        invalid_texts = ["图片不符合平台规则", "素材中包含人脸信息", "网络不顺畅", "服务器拥挤","处于使用高峰期"]
        
        elapsed = 0
        interval = 1
        
        while elapsed < 10:
            if await target_div.count() > 0:
                text = await target_div.text_content() or ""
                
                if any(wt in text for wt in invalid_texts):
                    for invalid_text in invalid_texts:
                        if invalid_text in text:
                            item_id = await target_div.get_attribute("id") or ""
                            data_id = await target_div.get_attribute("data-id") or ""
                            return {
                                "item_id": item_id,
                                "data_id": data_id,
                                "status": "invalid",
                                "message": invalid_text
                            }
                
                if any(wt in text for wt in waiting_texts):
                    await self.page.wait_for_timeout(interval * 1000)
                    elapsed += interval
                    continue

                if elapsed == 0:
                    await self.page.wait_for_timeout(interval * 1000)
                    continue
            
            break
        
        item_id = await target_div.get_attribute("id") if await target_div.count() > 0 else ""
        data_id = await target_div.get_attribute("data-id") if await target_div.count() > 0 else ""
        
        return {
            "item_id": item_id,
            "data_id": data_id,
            "status": "generating",
            "message": "内容生成中"
        }

    async def select_aspect_ratio_v2(self, ratio: str):
        if not ratio:
            return

        await self._close_any_open_dropdown()
        await self.page.wait_for_timeout(500)
        
        settings_btn = self.page.locator(".toolbar-settings-_tX5sB > div > button")
        if await settings_btn.count() > 0:
            await settings_btn.first.click(force=True)
            await self.page.wait_for_timeout(1000)
        
        normalized = ratio.lower()
        
        all_radios = await self.page.locator(".lv-radio-group .lv-radio").all()
        for radio in all_radios:
            text = await radio.text_content()
            if text and normalized in text.lower():
                await radio.click(force=True)
                await self.page.wait_for_timeout(500)
                await self._close_any_open_dropdown()
                return
        
        await self._close_any_open_dropdown()
        print(f"[JimengPage] select_aspect_ratio_v2: 未找到包含 '{ratio}' 的选项")
    
    async def set_seed(self, seed: str):
        if not seed:
            return
        
        await self._close_any_open_dropdown()
        await self.page.wait_for_timeout(500)
        
        settings_btn = self.page.locator(".toolbar-settings-_tX5sB > div > button")
        if await settings_btn.count() > 0:
            await settings_btn.first.click(force=True)
            await self.page.wait_for_timeout(1000)
        
        seed_select = self.page.locator("#dreamina-ui-configuration-content-wrapper .lv-select").nth(3)
        if await seed_select.count() > 0:
            await seed_select.first.click(force=True)
            await self.page.wait_for_timeout(500)
            
            seed_option = self.page.locator(".lv-select-option").filter(has_text=seed)
            if await seed_option.count() > 0:
                await seed_option.first.click(force=True)
                await self.page.wait_for_timeout(300)
            else:
                print(f"[JimengPage] set_seed: 未找到 seed={seed} 的选项")
        else:
            print(f"[JimengPage] set_seed: 未找到 seed 选择器")

    async def close_dialog(self):
        for _ in range(5):
            dialog = self.page.locator("div[role='dialog'][aria-modal='true']")
            if await dialog.count() > 0:
                close_btn = dialog.locator("div[class^='close-icon-wrapper-']")
                if await close_btn.count() > 0:
                    await close_btn.first.click(force=True)
                    await self.page.wait_for_timeout(300)
                return
            await self.page.wait_for_timeout(1000)