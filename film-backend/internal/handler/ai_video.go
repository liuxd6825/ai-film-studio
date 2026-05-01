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

type AIGenerateVideoRequest struct {
	CanvasID       string   `json:"canvas_id,omitempty"  validate:"required"`
	NodeID         string   `json:"node_id,omitempty"  validate:"required"`
	Prompt         string   `json:"prompt" validate:"required"`
	Model          string   `json:"model"  validate:"required"`
	AspectRatio    string   `json:"aspect_ratio,omitempty"  validate:"required"`
	Duration       int      `json:"duration,omitempty"  validate:"required"`
	FPS            int      `json:"fps,omitempty"  validate:"required"`
	ReferenceFiles []string `json:"reference_files,omitempty"`
}

type AIGenerateVideoResponse struct {
	TaskID    string `json:"task_id,omitempty"`
	ResultID  string `json:"result_id"`
	ResultURL string `json:"result_url"`
	Status    int    `json:"status"`
}

func (h *AIVideoHandler) Generate(ctx iris.Context) {
	projectID := ctx.Params().GetString("projectId")
	if projectID == "" {
		validator.InternalServerError(ctx, errors.New("projectID is required"))
		return
	}

	req, ok := validator.ParseAndValidate[AIGenerateVideoRequest](ctx)
	if !ok {
		return
	}

	model := req.Model

	if len(req.ReferenceFiles) > 0 {
		for i, fileUrl := range req.ReferenceFiles {
			if !strings.HasPrefix(fileUrl, "http://") && !strings.HasPrefix(fileUrl, "https://") {
				req.ReferenceFiles[i] = "http://127.0.0.1:17781" + fileUrl
			}
		}
	}

	aiReq := aioptions.NewTaskOptions{
		Prompt: req.Prompt,
		Model:  model,
		//Duration:       req.Duration,
		//Fps:            strconv.Itoa(req.FPS),
		//ReferenceFiles: req.ReferenceFiles,
		//AspectRatio:    req.AspectRatio,
	}
	aiTask, err := h.videoSvc.NewTask(ctx, aiReq)
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
			Model:     model,
			Prompt:    req.Prompt,
			Params: map[string]interface{}{
				"prompt":         req.Prompt,
				"model":          model,
				"duration":       req.Duration,
				"fps":            req.FPS,
				"referenceFiles": req.ReferenceFiles,
				"aspectRatio":    req.AspectRatio,
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
