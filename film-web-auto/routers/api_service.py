from sqlalchemy.ext.asyncio import AsyncSession
from services.jimeng.video import VideoGenerationService
from services.jimeng.image import ImageGenerationService
from services.gemini.image import ImageGenerationService as GeminiImageGenerationService
from services.gemini.remove_chat import GeminiRemoveChat
from services.client_request_service import ClientRequestService
from services.task_service import TaskService
from database.connection import AsyncSessionLocal
from core.config import settings
from schemas.response import Result
from utils.image import download_images
import uuid
import asyncio
import os
import cv2
from mutagen.mp3 import MP3
from mutagen.wave import WAVE


IMAGE_VALID = {
    "model": ["图片5.0 Lite"],
    "aspect_ratio": ["21:9","16:9","3:2","4:3","1:1", "3:4","2:3", "9:16"],
    "resolution": ["2k", "4k"]
}

VIDEO_VALID = {
    "model": ["Seedance 2.0", "Seedance 2.0 Fast", "Seedance 2.0 VIP", "Seedance 2.0 Fast VIP"],
    "work_type": ["全能参考"],
    "aspect_ratio": ["21:9","16:9","4:3","1:1", "3:4", "9:16"],
    "seed": ["4s", "5s", "6s","7s","8s","9s","10s","11s","12s","13s","14s", "15s"]
}

GEMINI_IMAGE_VALID = {
    "model": ["快速", "思考", "Pro"]
}


class ApiService:
    def __init__(self):
        self.video_service = VideoGenerationService()
        self.image_service = ImageGenerationService()
        self.gemini_image_service = GeminiImageGenerationService()

    def _build_result_url(self, request_id: str) -> str:
        return f"{settings.DOWNLOAD_URL_PREFIX}/api/v1/result/{request_id}"

    async def create_request(self, session: AsyncSession, workspace: str = "0", system: str = "jimeng") -> tuple[str, ClientRequestService]:
        request_id = str(uuid.uuid4())
        client_request_service = ClientRequestService(session)
        await client_request_service.create_client_request({
            "id": request_id,
            "workspace": workspace,
            "system": system,
            "status": "pending"
        })
        await session.commit()
        return request_id, client_request_service

    def _validate_image_params(self, prompt: str = None, model: str = None, aspect_ratio: str = None, resolution: str = None) -> list[str]:
        errors = []
        if not prompt or not prompt.strip():
            errors.append("prompt为必填项且不能为空")
        elif len(prompt) > 1960:
            errors.append("prompt长度不能超过1960个字符")
        if model is None:
            errors.append("model为必填项")
        elif model not in IMAGE_VALID["model"]:
            errors.append(f"model无效,可选值:{','.join(IMAGE_VALID['model'])}")
        if aspect_ratio is None:
            errors.append("aspect_ratio为必填项")
        elif aspect_ratio not in IMAGE_VALID["aspect_ratio"]:
            errors.append(f"aspect_ratio无效,可选值:{','.join(IMAGE_VALID['aspect_ratio'])}")
        if resolution is None:
            errors.append("resolution为必填项")
        elif resolution.lower() not in [r.lower() for r in IMAGE_VALID["resolution"]]:
            errors.append(f"resolution无效,可选值:{','.join(IMAGE_VALID['resolution'])}")
        return errors

    def _validate_video_params(self, prompt: str = None, model: str = None, work_type: str = None, aspect_ratio: str = None, seed: str = None) -> list[str]:
        errors = []
        if not prompt or not prompt.strip():
            errors.append("prompt为必填项且不能为空")
        elif len(prompt) > 1960:
            errors.append("prompt长度不能超过1960个字符")
        if model is None:
            errors.append("model为必填项")
        elif model not in VIDEO_VALID["model"]:
            errors.append(f"model无效,可选值:{','.join(VIDEO_VALID['model'])}")
        if work_type is None:
            errors.append("work_type为必填项")
        elif work_type not in VIDEO_VALID["work_type"]:
            errors.append(f"work_type无效,可选值:{','.join(VIDEO_VALID['work_type'])}")
        if aspect_ratio is None:
            errors.append("aspect_ratio为必填项")
        elif aspect_ratio not in VIDEO_VALID["aspect_ratio"]:
            errors.append(f"aspect_ratio无效,可选值:{','.join(VIDEO_VALID['aspect_ratio'])}")
        if seed is None:
            errors.append("seed为必填项")
        elif seed not in VIDEO_VALID["seed"]:
            errors.append(f"seed无效,可选值:{','.join(VIDEO_VALID['seed'])}")
        return errors

    def _validate_gemini_image_params(self, model: str = None) -> list[str]:
        errors = []
        if model is None:
            errors.append("model为必填项")
        elif model not in GEMINI_IMAGE_VALID["model"]:
            errors.append(f"model无效,可选值:{','.join(GEMINI_IMAGE_VALID['model'])}")
        return errors

    def _get_video_duration(self, filepath: str) -> float:
        try:
            cap = cv2.VideoCapture(filepath)
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
            cap.release()
            if fps > 0:
                return frame_count / fps
            return 0.0
        except Exception:
            return 0.0

    def _get_audio_duration(self, filepath: str) -> float:
        try:
            ext = os.path.splitext(filepath.lower())[1]
            if ext == ".mp3":
                audio = MP3(filepath)
            elif ext == ".wav":
                audio = WAVE(filepath)
            else:
                return 0.0
            return audio.info.length
        except Exception:
            return 0.0

    def _get_image_resolution(self, filepath: str) -> tuple[int, int] | None:
        try:
            img = cv2.imread(filepath)
            if img is not None:
                h, w = img.shape[:2]
                return (w, h)
            return None
        except Exception:
            return None

    def _validate_resolution(self, width: int, height: int, filename: str) -> list[str]:
        errors = []
        min_side = min(width, height)
        max_side = max(width, height)

        if width > 4096 or height > 4096:
            errors.append(f"图片最大分辨率4096×4096")
        if min_side < 320:
            errors.append(f"图片最短边需≥320px")
        if max_side / min_side > 3:
            errors.append(f"图片宽高比需在1:3~3:1之间")

        return errors

    def _validate_video_files(self, files: list[str]) -> list[str]:
        errors = []
        if not files:
            return errors

        image_exts = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".tif", ".gif"}
        video_exts = {".mp4", ".mov"}
        audio_exts = {".mp3", ".wav"}

        image_count = 0
        video_count = 0
        audio_count = 0
        total_video_audio_duration = 0.0
        total_video_size = 0
        total_audio_size = 0

        for filepath in files:
            if not os.path.isfile(filepath):
                errors.append(f"文件不存在:{filepath}")
                continue
            ext = os.path.splitext(filepath.lower())[1]
            size = os.path.getsize(filepath)

            if ext in image_exts:
                image_count += 1
                if size > 30 * 1024 * 1024:
                    errors.append(f"图片文件大小不能超过30MB")
                resolution_errors = self._validate_resolution(*resolution, os.path.basename(filepath)) if (resolution := self._get_image_resolution(filepath)) else ["图片无法读取分辨率"]
                errors.extend(resolution_errors)
            elif ext in video_exts:
                video_count += 1
                total_video_size += size
                duration = self._get_video_duration(filepath)
                if duration > 0 and duration < 2:
                    errors.append(f"视频时长不能少于2秒")
                total_video_audio_duration += duration
            elif ext in audio_exts:
                audio_count += 1
                total_audio_size += size
                duration = self._get_audio_duration(filepath)
                if duration > 0 and duration < 2:
                    errors.append(f"音频时长不能少于2秒")
                total_video_audio_duration += duration

        if image_count > 9:
            errors.append(f"图片最多上传9张，当前上传{image_count}张")
        if video_count > 3:
            errors.append(f"视频最多上传3个，当前上传{video_count}个")
        if audio_count > 3:
            errors.append(f"音频最多上传3个，当前上传{audio_count}个")
        if image_count + video_count + audio_count > 12:
            errors.append(f"总文件数上限12个，当前上传{image_count + video_count + audio_count}个")

        if total_video_size > 50 * 1024 * 1024:
            errors.append(f"视频总大小限制50MB，当前{total_video_size / 1024 / 1024:.2f}MB")
        if total_audio_size > 15 * 1024 * 1024:
            errors.append(f"音频总大小限制15MB，当前{total_audio_size / 1024 / 1024:.2f}MB")
        if total_video_audio_duration > 15:
            errors.append(f"音频+视频总时长不超过15秒，当前{total_video_audio_duration:.2f}秒")
        if audio_count > 0 and image_count == 0 and video_count == 0:
            errors.append("音频文件需要配合图片或视频使用")

        return errors

    def _validate_images_files(self, files: list[str]) -> list[str]:
        errors = []
        if not files:
            return errors

        valid_exts = {".jpg", ".jpeg", ".png"}

        for filepath in files:
            if not os.path.isfile(filepath):
                errors.append(f"文件不存在:{filepath}")
                continue

            ext = os.path.splitext(filepath.lower())[1]
            if ext not in valid_exts:
                errors.append(f"图片格式仅支持JPEG、PNG")
                continue

            size = os.path.getsize(filepath)
            if size > 15 * 1024 * 1024:
                errors.append(f"图片大小不能超过15MB")

            resolution = self._get_image_resolution(filepath)
            if resolution:
                errors.extend(self._validate_resolution(*resolution, os.path.basename(filepath)))
            else:
                errors.append(f"图片无法读取分辨率")

        if len(files) > 6:
            errors.append(f"图片最多上传6张，当前上传{len(files)}张")

        return errors

    async def _download_files(self, files_url: list[str]) -> tuple[list[str] | None, str | None]:
        if not files_url:
            return [], None
        try:
            cached_paths = await download_images(files_url)
            return cached_paths, None
        except Exception as e:
            error_msg = f"文件下载失败:{files_url} - {str(e)}"
            return None, error_msg

    async def generate_video(self, session: AsyncSession, req) -> Result:
        errors = self._validate_video_params(
            prompt=req.prompt,
            model=req.model,
            work_type=req.work_type,
            aspect_ratio=req.aspect_ratio,
            seed=req.seed
        )

        files, download_error = await self._download_files(req.files_url)
        if download_error:
            errors.append(download_error)

        file_errors = self._validate_video_files(files or [])
        if file_errors:
            errors.extend(file_errors)

        if errors:
            return Result(code=400, success=False, message="; ".join(errors), data=None)

        workspace = req.workspace or "0"
        request_id, _ = await self.create_request(session, workspace)

        async def background_generate():
            async with AsyncSessionLocal() as bg_session:
                await self.video_service.generate(
                    session=bg_session,
                    model=req.model,
                    work_type=req.work_type,
                    files=files,
                    prompt=req.prompt,
                    aspect_ratio=req.aspect_ratio,
                    seed=req.seed,
                    request_id=request_id,
                    workspace=workspace
                )

        asyncio.create_task(background_generate())
        return Result(data={"result_id": request_id, "result": "", "result_url": self._build_result_url(request_id)})

    async def generate_image(self, session: AsyncSession, req) -> Result:
        errors = self._validate_image_params(
            prompt=req.prompt,
            model=req.model,
            aspect_ratio=req.aspect_ratio,
            resolution=req.resolution
        )

        files, download_error = await self._download_files(req.files_url)
        if download_error:
            errors.append(download_error)

        file_errors = self._validate_images_files(files or [])
        if file_errors:
            errors.extend(file_errors)

        if errors:
            return Result(code=400, success=False, message="; ".join(errors), data=None)

        workspace = req.workspace or "0"
        request_id, _ = await self.create_request(session, workspace)

        async def background_generate():
            async with AsyncSessionLocal() as bg_session:
                await self.image_service.generate(
                    session=bg_session,
                    model=req.model,
                    files=files,
                    prompt=req.prompt,
                    aspect_ratio=req.aspect_ratio,
                    resolution=req.resolution,
                    width=req.width,
                    height=req.height,
                    request_id=request_id,
                    workspace=workspace
                )

        asyncio.create_task(background_generate())
        return Result(data={"result_id": request_id, "result": "", "result_url": self._build_result_url(request_id)})

    async def generate_videos(self, session: AsyncSession, req) -> Result:
        all_errors = []

        for idx, video_req in enumerate(req.requests):
            errors = self._validate_video_params(
                prompt=video_req.prompt,
                model=video_req.model,
                work_type=video_req.work_type,
                aspect_ratio=video_req.aspect_ratio,
                seed=video_req.seed
            )
            if errors:
                all_errors.append(f"请求[{idx}]:{' '.join(errors)}")

            files, download_error = await self._download_files(video_req.files_url)
            if download_error:
                all_errors.append(f"请求[{idx}]:{download_error}")

        if all_errors:
            return Result(code=400, success=False, message="; ".join(all_errors), data=None)

        workspace = req.workspace or "0"
        request_id, _ = await self.create_request(session, workspace)

        async def background_generate():
            async with AsyncSessionLocal() as bg_session:
                for video_req in req.requests:
                    files, _ = await self._download_files(video_req.files_url)
                    await self.video_service.generate(
                        session=bg_session,
                        model=video_req.model,
                        work_type=video_req.work_type,
                        files=files or [],
                        prompt=video_req.prompt,
                        aspect_ratio=video_req.aspect_ratio,
                        seed=video_req.seed,
                        request_id=request_id,
                        workspace=workspace
                    )

        asyncio.create_task(background_generate())
        return Result(data={"result_id": request_id, "result": "生成中", "result_url": self._build_result_url(request_id)})

    async def generate_images(self, session: AsyncSession, req) -> Result:
        all_errors = []

        for idx, image_req in enumerate(req.requests):
            errors = self._validate_image_params(
                prompt=image_req.prompt,
                model=image_req.model,
                aspect_ratio=image_req.aspect_ratio,
                resolution=image_req.resolution
            )
            if errors:
                all_errors.append(f"请求[{idx}]:{' '.join(errors)}")

            files, download_error = await self._download_files(image_req.files_url)
            if download_error:
                all_errors.append(f"请求[{idx}]:{download_error}")

        if all_errors:
            return Result(code=400, success=False, message="; ".join(all_errors), data=None)

        workspace = req.workspace or "0"
        request_id, _ = await self.create_request(session, workspace)

        async def background_generate():
            async with AsyncSessionLocal() as bg_session:
                for image_req in req.requests:
                    files, _ = await self._download_files(image_req.files_url)
                    await self.image_service.generate(
                        session=bg_session,
                        model=image_req.model,
                        files=files or [],
                        prompt=image_req.prompt,
                        aspect_ratio=image_req.aspect_ratio,
                        resolution=image_req.resolution,
                        width=image_req.width,
                        height=image_req.height,
                        request_id=request_id,
                        workspace=workspace
                    )

        asyncio.create_task(background_generate())
        return Result(data={"result_id": request_id, "result": "生成中", "result_url": self._build_result_url(request_id)})

    async def generate_gemini_image(self, session: AsyncSession, req) -> Result:
        if req.model is None:
            req.model = "思考"
        errors = self._validate_gemini_image_params(model=req.model)
        if not req.prompt or not req.prompt.strip():
            errors.append("prompt为必填项且不能为空")

        files, download_error = await self._download_files(req.files_url)
        if download_error:
            errors.append(download_error)

        if errors:
            return Result(code=400, success=False, message="; ".join(errors), data=None)

        workspace = req.workspace
        if workspace=="":
            workspace = "0"

        request_id, _ = await self.create_request(session, workspace, system="gemini")

        async def background_generate():
            async with AsyncSessionLocal() as bg_session:
                await self.gemini_image_service.generate(
                    session=bg_session,
                    files=files,
                    prompt=req.prompt,
                    model=req.model,
                    request_id=request_id
                )

        asyncio.create_task(background_generate())
        return Result(data={"result_id": request_id, "result": "生成中", "result_url": self._build_result_url(request_id)})

    async def generate_gemini_images(self, session: AsyncSession, req) -> Result:
        all_errors = []

        for idx, image_req in enumerate(req.requests):
            model_errors = self._validate_gemini_image_params(model=image_req.model)
            if model_errors:
                all_errors.extend([f"请求[{idx}]: {e}" for e in model_errors])

            if not image_req.prompt or not image_req.prompt.strip():
                all_errors.append(f"请求[{idx}]: prompt为必填项且不能为空")

            files, download_error = await self._download_files(image_req.files_url)
            if download_error:
                all_errors.append(f"请求[{idx}]:{download_error}")

        if all_errors:
            return Result(code=400, success=False, message="; ".join(all_errors), data=None)

        workspace = "0"
        request_id, _ = await self.create_request(session, workspace, system="gemini")

        async def background_generate():
            async with AsyncSessionLocal() as bg_session:
                for image_req in req.requests:
                    files, _ = await self._download_files(image_req.files_url)
                    await self.gemini_image_service.generate(
                        session=bg_session,
                        files=files or [],
                        prompt=image_req.prompt,
                        model=image_req.model,
                        request_id=request_id
                    )

        asyncio.create_task(background_generate())
        return Result(data={"result_id": request_id, "result": "生成中", "result_url": self._build_result_url(request_id)})

    async def remove_gemini_chat(self, req) -> Result:
        if not req.reserved_quantity and not req.reserved_time_length:
            return Result(code=400, success=False, message="至少需要传递一个参数：reserved_quantity 或 reserved_time_length")
        asyncio.create_task(GeminiRemoveChat.remove_chats(
            reserved_quantity=req.reserved_quantity,
            reserved_time_length=req.reserved_time_length
        ))
        return Result(code=200, success=True, message="删除任务已提交")


    async def get_request(self, session: AsyncSession, request_id: str)-> Result:
        client_request_service = ClientRequestService(session)
        client_request = await client_request_service.get_client_request(request_id)

        if not client_request:
            return Result(code=404, success=False, message="Request not found")

        return Result(
            code=200,
            success=True,
            data={
                "request_id": client_request.id,
                "status":client_request.status,
                "system":client_request.system,
                "desc":client_request.desc,
                "workspace": client_request.workspace,
            }
        )



    async def get_request_result(self, session: AsyncSession, request_id: str) -> Result:
        client_request_service = ClientRequestService(session)
        task_service = TaskService(session)

        client_request = await client_request_service.get_client_request(request_id)
        if not client_request:
            return Result(code=404, success=False, message="Request not found")

        tasks = await task_service.get_tasks_by_request_id(request_id)

        task_ids = [task.id for task in tasks]
        task_results = await task_service.get_results_by_task_ids(task_ids)

        results_by_task = {}
        for result in task_results:
            if result.task_id not in results_by_task:
                results_by_task[result.task_id] = []
            results_by_task[result.task_id].append(result)

        task_list = []
        for task in tasks:
            workspace = task.workspace or "0"
            system = task.system or "jimeng"
            task_results = results_by_task.get(task.id, [])
            results_with_workspace = []
            for result in task_results:
                if result and result.file_name:
                    results_with_workspace.append(f"{settings.DOWNLOAD_URL_PREFIX}/downloads/{system}/{workspace}/{result.file_name}")
                elif result and result.file_path:
                    filename = result.file_path.split("/")[-1]
                    results_with_workspace.append(f"{settings.DOWNLOAD_URL_PREFIX}/downloads/{system}/{workspace}/{filename}")
                else:
                    results_with_workspace.append(None)
            client_request.status = task.status
            task_list.append({
                "id": task.id,
                "workspace": workspace,
                "type": task.type,
                "status": task.status,
                "desc": task.desc,
                "created_at": task.created_at.isoformat() if task.created_at else None,
                "updated_at": task.updated_at.isoformat() if task.updated_at else None,
                "file_urls": results_with_workspace
            })


        return Result(
            code=200,
            success=True,
            data={
                "request_id": client_request.id,
                "status": client_request.status,
                "system": client_request.system,
                "desc": client_request.desc,
                "workspace": client_request.workspace,
                "tasks": task_list
            }
        )


api_service = ApiService()