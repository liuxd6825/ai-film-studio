package handler

import (
	"context"
	"errors"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/service/ai_video"
	"open-film-service/internal/service/canvas_task"
	"strings"

	"open-film-service/internal/pkg/validator"

	"github.com/kataras/iris/v12"
)

type AIVideoHandler struct {
	videoSvc *ai_video.Service
	taskSvc  *canvas_task.Service
}

func NewAIVideoHandler(videoSvc *ai_video.Service, taskSvc *canvas_task.Service) *AIVideoHandler {
	return &AIVideoHandler{
		videoSvc: videoSvc,
		taskSvc:  taskSvc,
	}
}

func (h *AIVideoHandler) Generate(ctx iris.Context) {
	projectID := ctx.Params().GetString("projectId")
	if projectID == "" {
		validator.InternalServerError(ctx, errors.New("projectID is required"))
		return
	}

	req, ok := validator.ParseAndValidate[ai_video.AIGenerateVideoRequest](ctx)
	if !ok {
		return
	}

	if req.Workspace == "" {
		req.Workspace = "12358121623308"
	}

	if len(req.ReferenceFiles) > 0 {
		for i, fileUrl := range req.ReferenceFiles {
			if !strings.HasPrefix(fileUrl, "http://") && !strings.HasPrefix(fileUrl, "https://") {
				req.ReferenceFiles[i] = "http://127.0.0.1:17781" + fileUrl
			}
		}
	}

	videoReq := ai_video.AIGenerateVideoRequest{
		Prompt:         req.Prompt,
		Model:          req.Model,
		ReferenceFiles: req.ReferenceFiles,
		AspectRatio:    req.AspectRatio,
		Workspace:      req.Workspace,
		Duration:       req.Duration,
	}

	aiTask, err := h.videoSvc.NewTask(ctx, videoReq)
	if err != nil {
		validator.InternalServerError(ctx, err)
		return
	}

	if h.taskSvc != nil && req.NodeID != "" {
		createTaskRequest := canvas_task.CreateTaskRequest{
			TaskId:    aiTask.TaskId,
			ProjectID: projectID,
			CanvasID:  req.CanvasID,
			NodeID:    req.NodeID,
			TaskType:  aioptions.TaskTypeVideo,
			Provider:  aiTask.Provider,
			Model:     req.Model,
			Prompt:    req.Prompt,
			Params: map[string]interface{}{
				"prompt":         req.Prompt,
				"model":          req.Model,
				"duration":       req.Duration,
				"referenceFiles": req.ReferenceFiles,
				"aspectRatio":    req.AspectRatio,
				"workspace":      req.Workspace,
			},
		}
		task, createErr := h.taskSvc.CreateTask(createTaskRequest)
		if createErr != nil {
			validator.InternalServerError(ctx, createErr)
			return
		} else {
			validator.Success(ctx, task)
		}
	}
}

func (h *AIVideoHandler) GetTask(ctx iris.Context) {
	projectID := ctx.Params().GetString("projectId")
	if projectID == "" {
		validator.InternalServerError(ctx, errors.New("projectID is required"))
		return
	}
	taskId := ctx.Params().GetString("taskId")
	if taskId == "" {
		validator.InternalServerError(ctx, errors.New("taskId is required"))
		return
	}

	task, err := h.taskSvc.GetTask(taskId)
	if err != nil {
		validator.InternalServerError(ctx, err)
	} else {
		validator.Success(ctx, task)
	}
}

func (h *AIVideoHandler) GetModels(ctx iris.Context) {
	models := h.videoSvc.GetModels(context.Background())
	validator.Success(ctx, models)
}
