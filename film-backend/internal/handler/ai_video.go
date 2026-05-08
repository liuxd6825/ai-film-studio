package handler

import (
	"context"
	"errors"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/model"
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

	var canvasTask *model.CanvasTask
	canvasTask, err = h.taskSvc.CreateTask(
		canvas_task.CreateTaskRequest{
			TaskId:    aiTask.TaskId,
			ProjectID: projectID,
			CanvasID:  req.CanvasID,
			NodeID:    req.NodeID,
			Provider:  aiTask.Provider,
			Model:     req.Model,
			Prompt:    req.Prompt,
			TaskType:  aioptions.TaskTypeImage,
			Workspace: req.Workspace,
			Params: map[string]any{
				"promptType":  req.PromptType,
				"aspectRatio": req.AspectRatio,
			},
		},
	)
	if err != nil {
		validator.InternalServerError(ctx, err)
		return
	}
	validator.Success(ctx, canvasTask)
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

	task, err := h.videoSvc.GetTask(context.Background(), taskId)
	if err != nil {
		validator.InternalServerError(ctx, err)
	} else {
		validator.Success(ctx, task)
	}
}

func (h *AIVideoHandler) GetTask2(ctx iris.Context) {
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
