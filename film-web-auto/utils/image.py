import os
import uuid
import re
import aiohttp
import asyncio
import time
from pathlib import Path
from core.config import settings


def extract_filename_from_content_disposition(header_value: str) -> str | None:
    if not header_value:
        return None
    match = re.search(r"filename\*=(?:UTF-8'')?([^;\n]*)", header_value, re.IGNORECASE)
    if match:
        filename = match.group(1).strip()
        try:
            from urllib.parse import unquote
            return unquote(filename)
        except Exception:
            return filename
    match = re.search(r'filename=(?:[\'"]?)([^;\'"\n]*)', header_value)
    if match:
        return match.group(1).strip('"\'')
    return None


def get_file_ext(url: str) -> str:
    ext = url.split("/")[-1].split("?")[0]
    if "." in ext:
        return "." + ext.split(".")[-1]
    return ".jpg"


async def download_image(url: str, cache_dir: str) -> str:
    Path(cache_dir).mkdir(parents=True, exist_ok=True)

    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status != 200:
                raise ValueError(f"Failed to download {url}: {response.status}")

            content_disposition = response.headers.get("Content-Disposition", "")
            filename = extract_filename_from_content_disposition(content_disposition)
            if filename:
                ext = os.path.splitext(filename)[1].lower()
                if ext:
                    ext = ext if ext else get_file_ext(url)
                else:
                    ext = get_file_ext(url)
            else:
                ext = get_file_ext(url)

            content = await response.read()

    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(cache_dir, filename)
    with open(filepath, "wb") as f:
        f.write(content)

    return filepath


async def download_images(urls: list[str], cache_dir: str = None) -> list[str]:
    if cache_dir is None:
        cache_dir = settings.IMAGE_CACHE_DIR
    
    if not urls:
        return []
    
    tasks = [download_image(url, cache_dir) for url in urls]
    filepaths = await asyncio.gather(*tasks)
    
    return filepaths


def cleanup_old_images(cache_dir: str = None, hours: int = 8):
    if cache_dir is None:
        cache_dir = settings.IMAGE_CACHE_DIR
    
    if not os.path.exists(cache_dir):
        return
    
    cutoff = time.time() - (hours * 3600)
    
    for filename in os.listdir(cache_dir):
        filepath = os.path.join(cache_dir, filename)
        if os.path.isfile(filepath):
            if os.path.getmtime(filepath) < cutoff:
                os.remove(filepath)


def get_download_context(page, download_dir: str = None, timeout: int = 60000):
    if download_dir is None:
        download_dir = os.path.join(os.path.dirname(__file__), "..", "cache", "downloads")
    
    Path(download_dir).mkdir(parents=True, exist_ok=True)
    
    return page.expect_download(timeout=timeout)


async def save_download(download_info, download_dir: str = None) -> str:
    if download_dir is None:
        download_dir = os.path.join(os.path.dirname(__file__), "..", "cache", "downloads")
    
    download = await download_info.value
    filename = download.suggested_filename or f"{uuid.uuid4()}.tmp"
    filepath = os.path.join(download_dir, filename)
    await download.save_as(filepath)
    
    return filepath