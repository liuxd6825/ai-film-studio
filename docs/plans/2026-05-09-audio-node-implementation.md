# AudioNode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现 AudioNode 节点，支持 TTS 音频生成和音频文件上传预览功能

**Architecture:** 前端新增 AudioNode 组件和相关类型定义，后端新增 AIAudioHandler 和 ai_audio Service，参考 ai_image.go 的实现模式

**Tech Stack:** React + TypeScript (前端), Go + Iris (后端), canvasFileApi (文件上传)

---

## Part 1: 前端实现

### Task 1: 更新 canvasNodes.ts 添加 AudioNodeData

**Files:**
- Modify: `film-frontend/src/features/canvas/domain/canvasNodes.ts`

**Step 1: 添加 AudioNodeData 接口**

在 `TextNodeData` 接口后添加：

```typescript
export type AudioTaskStatus =
  | "idle"
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "unknown";

export interface AudioNodeData extends NodeDisplayData {
  content: string;
  prompt: string;
  audioUrl: string | null;
  previewAudioUrl: string | null;
  sourceFileName: string;
  voice: string;
  mode: 'prompt' | 'upload';
  taskStatus: AudioTaskStatus;
  taskProgress: number;
  taskId?: string;
  errorMessage?: string;
  fileSize?: number;
}
```

**Step 2: 添加 CANVAS_NODE_TYPES.audio**

在 `CANVAS_NODE_TYPES` 中添加：
```typescript
audio: "audioNode",
```

**Step 3: 更新 CanvasNodeData union 类型**

在 union 类型中添加 `AudioNodeData`。

**Step 4: 提交**
```bash
git add film-frontend/src/features/canvas/domain/canvasNodes.ts
git commit -m "feat(canvas): add AudioNodeData interface and CANVAS_NODE_TYPES.audio"
```

---

### Task 2: 更新 nodeRegistry.ts 添加 audioNodeDefinition

**Files:**
- Modify: `film-frontend/src/features/canvas/domain/nodeRegistry.ts`

**Step 1: 添加导入**

确保导入了 `AudioNodeData` 类型。

**Step 2: 添加 audioNodeDefinition**

在 `textNodeDefinition` 后添加：

```typescript
const audioNodeDefinition: CanvasNodeDefinition<AudioNodeData> = {
  type: CANVAS_NODE_TYPES.audio,
  menuLabelKey: "node.menu.audio",
  menuIcon: "sparkles",
  visibleInMenu: true,
  capabilities: {
    toolbar: true,
    promptInput: false,
  },
  connectivity: {
    sourceHandle: true,
    targetHandle: true,
    connectMenu: {
      fromSource: true,
      fromTarget: true,
    },
  },
  createDefaultData: () => ({
    displayName: "",
    content: "",
    prompt: "",
    audioUrl: null,
    previewAudioUrl: null,
    sourceFileName: "",
    voice: "default",
    mode: "prompt",
    taskStatus: "idle",
    taskProgress: 0,
  }),
};
```

**Step 3: 更新 canvasNodeDefinitions**

在 `canvasNodeDefinitions` record 中添加：
```typescript
[CANVAS_NODE_TYPES.audio]: audioNodeDefinition,
```

**Step 4: 提交**
```bash
git add film-frontend/src/features/canvas/domain/nodeRegistry.ts
git commit -m "feat(canvas): add audioNodeDefinition to nodeRegistry"
```

---

### Task 3: 创建 audioApi.ts

**Files:**
- Create: `film-frontend/src/features/canvas/api/audioApi.ts`

**Step 1: 创建 API 文件**

```typescript
import { api } from "../../../api/client";

export interface AudioModel {
  id: string;
  title: string;
}

export interface Voice {
  id: string;
  title: string;
}

export interface AudioGenerateRequest {
  canvasId: string;
  nodeId: string;
  prompt: string;
  model: string;
  voice?: string;
}

export interface AudioTask {
  id: string;
  status: string;
  resultUrl?: string;
  errorMessage?: string;
}

export const audioApi = {
  generate: (projectId: string, req: AudioGenerateRequest): Promise<AudioTask> =>
    api.post(`/projects/${projectId}/audio/generate`, req),

  getModels: (projectId: string): Promise<AudioModel[]> =>
    api.get(`/projects/${projectId}/audio/models`),

  getVoices: (projectId: string): Promise<Voice[]> =>
    api.get(`/projects/${projectId}/audio/voices`),

  getTask: (projectId: string, taskId: string): Promise<AudioTask> =>
    api.get(`/projects/${projectId}/audio/task?taskId=${taskId}`),
};
```

**Step 2: 提交**
```bash
git add film-frontend/src/features/canvas/api/audioApi.ts
git commit -m "feat(canvas): add audioApi for AudioNode"
```

---

### Task 4: 创建 AudioNode.tsx 组件

**Files:**
- Create: `film-frontend/src/features/canvas/nodes/AudioNode.tsx`

**Step 1: 创建 AudioNode 组件**

参考 VideoNode.tsx 和 TextNode.tsx 的实现模式，创建完整的 AudioNode 组件，包含：
- Upload 模式（拖拽/粘贴/点击上传）
- Prompt 模式（浮动面板输入 prompt，选择 voice）
- 音频播放器预览
- 工具栏（预览、下载、删除）
- Handle（左侧 target，右侧 source）

**Step 2: 提交**
```bash
git add film-frontend/src/features/canvas/nodes/AudioNode.tsx
git commit -m "feat(canvas): add AudioNode component with upload and prompt modes"
```

---

### Task 5: 更新 nodes/index.tsx 注册 AudioNode

**Files:**
- Modify: `film-frontend/src/features/canvas/nodes/index.tsx`

**Step 1: 添加导入和注册**

```typescript
import { AudioNode } from "./AudioNode";

export {
  // ... existing exports
  AudioNode,
};

export const nodeTypes = {
  // ... existing entries
  [CANVAS_NODE_TYPES.audio]: AudioNode,
};
```

**Step 2: 提交**
```bash
git add film-frontend/src/features/canvas/nodes/index.tsx
git commit -m "feat(canvas): register AudioNode in nodeTypes"
```

---

## Part 2: 后端实现

### Task 6: 创建 ai_audio Service

**Files:**
- Create: `film-backend/internal/service/ai_audio/service.go`

**Step 1: 创建 service 文件**

参考 `internal/service/ai_image/service.go` 的结构：

```go
package ai_audio

import (
	"context"
	"open-film-service/internal/ai"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/config"
	"open-film-service/internal/repository"
)

type Voice struct {
	Id    string `json:"id,omitempty"`
	Title string `json:"title,omitempty"`
}

type GenerationRequest struct {
	Prompt     string `json:"prompt"`
	Model      string `json:"model"`
	Voice      string `json:"voice"`
	Workspace  string `json:"workspace"`
}

type Service struct {
	config          *config.Config
	aiAudioService *ai.AiAudioService
	canvasTaskRepos *repository.CanvasTaskRepository
	voices         []Voice
}

func NewService(cfg *config.Config, aiAudioService *ai.AiAudioService, canvasTaskRepos *repository.CanvasTaskRepository) *Service {
	return &Service{
		config:          cfg,
		aiAudioService:  aiAudioService,
		canvasTaskRepos: canvasTaskRepos,
		voices: []Voice{
			{Id: "default", Title: "默认音色"},
			{Id: "male", Title: "男声"},
			{Id: "female", Title: "女声"},
		},
	}
}

func (s *Service) NewTask(ctx context.Context, request GenerationRequest) (*aioptions.Task, error) {
	newTaskOptions := aioptions.NewTaskOptions{
		Model:    request.Model,
		Prompt:   request.Prompt,
		TaskType: aioptions.TaskTypeAudio,
		Workspace: request.Workspace,
	}
	return s.aiAudioService.NewTask(ctx, newTaskOptions)
}

func (s *Service) GetTask(ctx context.Context, taskID string) (*aioptions.Task, error) {
	task, err := s.canvasTaskRepos.GetByID(taskID)
	if err != nil {
		return nil, err
	}
	return s.aiAudioService.GetTask(ctx, task.Model, taskID)
}

func (s *Service) GetModels(ctx context.Context) []aioptions.Model {
	return s.aiAudioService.GetModels()
}

func (s *Service) GetVoices() []Voice {
	return s.voices
}
```

**Step 2: 提交**
```bash
git add film-backend/internal/service/ai_audio/service.go
git commit -m "feat(audio): add ai_audio service"
```

---

### Task 7: 创建 AiAudioService

**Files:**
- Create: `film-backend/internal/ai/ai_audio.go`

**Step 1: 创建 AiAudioService**

参考 `internal/ai/ai_image.go` 或 `internal/ai/ai_video.go` 的结构：

```go
package ai

import (
	"context"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/config"
)

type AiAudioService struct {
	cfg *config.AudioModelsConfig
}

func NewAiAudioService(cfg *config.AudioModelsConfig) *AiAudioService {
	return &AiAudioService{cfg: cfg}
}

func (s *AiAudioService) NewTask(ctx context.Context, opts aioptions.NewTaskOptions) (*aioptions.Task, error) {
	// TODO: Implement TTS API call
	return aioptions.NewTask("placeholder_task_id", opts.Model, aioptions.TaskStatusCompleted), nil
}

func (s *AiAudioService) GetTask(ctx context.Context, model, taskID string) (*aioptions.Task, error) {
	// TODO: Implement task status polling
	return aioptions.NewTask(taskID, model, aioptions.TaskStatusCompleted), nil
}

func (s *AiAudioService) GetModels() []aioptions.Model {
	return []aioptions.Model{
		{Id: "tts-1", Title: "TTS Model 1"},
	}
}
```

**Step 2: 提交**
```bash
git add film-backend/internal/ai/ai_audio.go
git commit -m "feat(audio): add AiAudioService"
```

---

### Task 8: 创建 AIAudioHandler

**Files:**
- Create: `film-backend/internal/handler/ai_audio.go`

**Step 1: 创建 handler 文件**

参考 `internal/handler/ai_image.go`：

```go
package handler

import (
	"context"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/ai_audio"
	canvasTaskSvc "open-film-service/internal/service/canvas_task"
	"strings"

	"github.com/kataras/iris/v12"
)

type AIAudioHandler struct {
	audioSvc *ai_audio.Service
	taskSvc  *canvasTaskSvc.Service
}

func NewAudioHandler(svc *ai_audio.Service, taskSvc *canvasTaskSvc.Service) *AIAudioHandler {
	return &AIAudioHandler{audioSvc: svc, taskSvc: taskSvc}
}

type GenerateAudioRequest struct {
	CanvasID   string `json:"canvasId,omitempty"`
	NodeID     string `json:"nodeId,omitempty"`
	Prompt     string `json:"prompt" validate:"required"`
	Model      string `json:"model" validate:"required"`
	Voice      string `json:"voice,omitempty"`
	Workspace  string `json:"workspace"`
}

func (h *AIAudioHandler) InitHandler(api iris.Party) {
	api.Post("/projects/:projectId/audio/generate", h.Generate)
	api.Get("/projects/:projectId/audio/models", h.GetModels)
	api.Get("/projects/:projectId/audio/voices", h.GetVoices)
	api.Get("/projects/:projectId/audio/task", h.GetTask)
}

func (h *AIAudioHandler) Generate(ctx iris.Context) {
	projectID := ctx.Params().GetString("projectId")

	req, ok := validator.ParseAndValidate[GenerateAudioRequest](ctx)
	if !ok {
		return
	}

	if req.Workspace == "" {
		req.Workspace = "24abc74312f3960a"
	}

	audioReq := ai_audio.GenerationRequest{
		Prompt:    req.Prompt,
		Model:     req.Model,
		Voice:     req.Voice,
		Workspace: req.Workspace,
	}

	aiTask, err := h.audioSvc.NewTask(context.Background(), audioReq)
	if err != nil {
		validator.InternalServerError(ctx, err)
		return
	}

	canvasTask, err := h.taskSvc.CreateTask(
		canvasTaskSvc.CreateTaskRequest{
			TaskId:    aiTask.TaskId,
			ProjectID: projectID,
			CanvasID:  req.CanvasID,
			NodeID:    req.NodeID,
			Provider:  aiTask.Provider,
			Model:     req.Model,
			Prompt:    req.Prompt,
			TaskType:  aioptions.TaskTypeAudio,
			Workspace: req.Workspace,
			Params: map[string]any{
				"voice": req.Voice,
			},
		},
	)
	if err != nil {
		validator.InternalServerError(ctx, err)
		return
	}
	validator.Success(ctx, canvasTask)
}

func (h *AIAudioHandler) GetTask(ctx iris.Context) {
	projectID := ctx.Params().GetString("projectId")
	if projectID == "" {
		validator.InternalServerError(ctx, iris.NewError("projectID is required"))
		return
	}
	taskId := ctx.Params().GetString("taskId")
	if taskId == "" {
		validator.InternalServerError(ctx, iris.NewError("taskId is required"))
		return
	}

	task, err := h.audioSvc.GetTask(context.Background(), taskId)
	if err != nil {
		validator.InternalServerError(ctx, err)
	} else {
		validator.Success(ctx, task)
	}
}

func (h *AIAudioHandler) GetModels(ctx iris.Context) {
	models := h.audioSvc.GetModels(context.Background())
	validator.Success(ctx, models)
}

func (h *AIAudioHandler) GetVoices(ctx iris.Context) {
	voices := h.audioSvc.GetVoices()
	validator.Success(ctx, voices)
}
```

**Step 2: 提交**
```bash
git add film-backend/internal/handler/ai_audio.go
git commit -m "feat(audio): add AIAudioHandler"
```

---

### Task 9: 更新 handler.go 添加 AIAudioHandler

**Files:**
- Modify: `film-backend/internal/handler/handler.go`

**Step 1: 添加 AIAudioHandler 字段**

在 Handler struct 中添加：
```go
AIAudioHandler *AIAudioHandler
```

在 NewHandler 函数参数中添加：
```go
audioHandler *AIAudioHandler,
```

在 NewHandler 返回值中设置：
```go
AIAudioHandler: audioHandler,
```

**Step 2: 提交**
```bash
git add film-backend/internal/handler/handler.go
git commit -m "feat(handler): add AIAudioHandler to Handler struct"
```

---

### Task 10: 更新 router.go 注册 AIAudioHandler 路由

**Files:**
- Modify: `film-backend/internal/handler/router.go`

**Step 1: 添加路由初始化调用**

在现有 AI 路由初始化后添加：
```go
// AI 音频生成路由
h.AIAudioHandler.InitHandler(api)
```

**Step 2: 提交**
```bash
git add film-backend/internal/handler/router.go
git commit -m "feat(router): register AIAudioHandler routes"
```

---

### Task 11: 更新 main.go 添加依赖注入

**Files:**
- Modify: `film-backend/cmd/server/main.go`

**Step 1: 添加导入**

```go
"open-film-service/internal/service/ai_audio"
```

**Step 2: 添加依赖注入**

找到 aiImageService 和 aiVideoService 的初始化，添加：
```go
aiAudioService := ai.NewAiAudioService(&cfg.AudioModels)

audioService := ai_audio.NewService(cfg, aiAudioService, canvasTaskRepo)
audioHandler := handler.NewAudioHandler(audioService, canvasTaskService)
```

**Step 3: 更新 NewHandler 调用**

在 handler.NewHandler 的参数列表中添加 audioHandler。

**Step 4: 提交**
```bash
git add film-backend/cmd/server/main.go
git commit -m "feat(main): add AIAudioService and AudioHandler dependency injection"
```

---

### Task 12: 确保 MediaTypeAudio 支持

**Files:**
- Modify: `film-backend/internal/model/media_task.go`

**Step 1: 检查 MediaType 定义**

确认存在：
```go
MediaTypeAudio MediaType = "audio"
```

如果不存在，添加它。

**Step 2: 提交**
```bash
git add film-backend/internal/model/media_task.go
git commit -m "feat(model): ensure MediaTypeAudio is defined"
```

---

## 验证步骤

完成所有任务后，执行以下验证：

1. **前端类型检查**：
```bash
cd film-frontend && npx tsc --noEmit
```

2. **后端编译检查**：
```bash
cd film-backend && go build ./...
```

3. **启动服务测试**：
```bash
# 后端
cd film-backend && go run ./cmd/server/main.go --config config.json

# 前端
cd film-frontend && npm run dev
```

---

## Plan Summary

| Part | Tasks | Files |
|------|-------|-------|
| Frontend | 5 | canvasNodes.ts, nodeRegistry.ts, audioApi.ts, AudioNode.tsx, index.tsx |
| Backend | 7 | service, ai_audio, handler, handler.go, router.go, main.go, media_task.go |

**Total: 12 tasks across 12 files**
