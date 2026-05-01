from sqlalchemy.ext.asyncio import AsyncSession
from services.jimeng.video import VideoGenerationService
from services.jimeng.image import ImageGenerationService
from services.gemini.image import ImageGenerationService as GeminiImageGenerationService
from services.client_request_service import ClientRequestService
from services.task_service import TaskService
from database.connection import AsyncSessionLocal
from core.config import settings
from schemas.response import Result
from utils.image import download_images
import uuid
import asyncio


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
    "model": ["制作图片"]
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
        return Result(data={"result_id": request_id, "result": "生成中", "result_url": self._build_result_url(request_id)})

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
        return Result(data={"result_id": request_id, "result": "生成中", "result_url": self._build_result_url(request_id)})

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
        errors = self._validate_gemini_image_params(model=req.model)
        if not req.prompt or not req.prompt.strip():
            errors.append("prompt为必填项且不能为空")

        files, download_error = await self._download_files(req.files_url)
        if download_error:
            errors.append(download_error)

        if errors:
            return Result(code=400, success=False, message="; ".join(errors), data=None)

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