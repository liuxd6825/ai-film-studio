import os
import uuid
import aiohttp
import asyncio
import time
from pathlib import Path
from core.config import settings


def get_file_ext(url: str) -> str:
    ext = url.split("/")[-1].split("?")[0]
    if "." in ext:
        return "." + ext.split(".")[-1]
    return ".jpg"


async def download_image(url: str, cache_dir: str) -> str:
    Path(cache_dir).mkdir(parents=True, exist_ok=True)
    
    filename = f"{uuid.uuid4()}{get_file_ext(url)}"
    filepath = os.path.join(cache_dir, filename)
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status != 200:
                raise ValueError(f"Failed to download {url}: {response.status}")
            
            content = await response.read()
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