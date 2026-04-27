import asyncio


async def _ensure_mouse_on_page(page):
    viewport = page.viewport_size
    if viewport:
        x = viewport["width"] // 2
        y = viewport["height"] // 2
        await page.mouse.move(x, y)


async def scroll_to_bottom(page, distance: int = 600):
    await _ensure_mouse_on_page(page)
    await page.mouse.wheel(0, distance)
    await asyncio.sleep(0.3)


async def scroll_to_page_bottom(page, distance: int = 600, max_iterations: int = 100):
    await _ensure_mouse_on_page(page)
    last_y = -1
    current_y = await page.evaluate("window.pageYOffset")
    iterations = 0
    while current_y != last_y and iterations < max_iterations:
        last_y = current_y
        await page.mouse.wheel(0, distance)
        await asyncio.sleep(0.3)
        current_y = await page.evaluate("window.pageYOffset")
        iterations += 1


async def scroll_up_by(page, distance: int = 600):
    await _ensure_mouse_on_page(page)
    await page.mouse.wheel(0, -distance)
    await asyncio.sleep(0.3)


async def scroll_to_top(page):
    await page.evaluate("window.scrollTo(0, 0)")
    await asyncio.sleep(0.3)


async def get_scroll_height(page) -> int:
    return await page.evaluate("document.documentElement.scrollHeight")


async def get_scroll_position(page) -> int:
    return await page.evaluate("window.pageYOffset")


async def scroll_element_to_bottom(page, selector: str, distance: int = 600, max_iterations: int = 100):
    last_scroll_top = -1
    iterations = 0
    locator = page.locator(selector).first
    while iterations < max_iterations:
        el = await locator.element_handle()
        if not el:
            break
        scroll_top = await el.evaluate(f"el => {{ el.scrollTop += {distance}; return el.scrollTop; }}")
        await asyncio.sleep(0.3)
        if scroll_top == last_scroll_top:
            break
        last_scroll_top = scroll_top
        iterations += 1
    return last_scroll_top


async def scroll_element_up_by(page, selector: str, distance: int = 600):
    locator = page.locator(selector).first
    el = await locator.element_handle()
    if not el:
        return -1
    return await el.evaluate(f"el => {{ el.scrollTop += {distance}; return el.scrollTop; }}")


async def get_element_scroll_position(page, selector: str) -> int:
    locator = page.locator(selector).first
    el = await locator.element_handle()
    if not el:
        return -1
    return await el.evaluate("el => el.scrollTop")


async def scroll_element_to_top(page, selector: str):
    locator = page.locator(selector).first
    el = await locator.element_handle()
    if el:
        await el.evaluate("el => el.scrollTop = 0")
    await asyncio.sleep(0.3)


async def find_scrollable_virtual_list(page) -> str:
    selector = await page.evaluate("""() => {
        const allElements = document.querySelectorAll('div[class*="virtual-list-"]');
        for (const el of allElements) {
            if (el.className.includes('virtual-list-container-')) {
                continue;
            }
            const style = window.getComputedStyle(el);
            if ((style.overflow === 'auto' || style.overflow === 'hidden auto' || 
                 style.overflowY === 'auto' || style.overflowY === 'hidden auto') &&
                el.scrollHeight > el.clientHeight) {
                return '.' + el.className.split(' ').join('.');
            }
        }
        return null;
    }""")
    return selector
