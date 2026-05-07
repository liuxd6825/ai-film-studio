package handler

import (
	"context"
	"errors"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/model"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/ai_image"
	canvasTaskSvc "open-film-service/internal/service/canvas_task"
	"strings"
	"time"

	"github.com/kataras/iris/v12"
)

type AIImageHandler struct {
	imageSvc *ai_image.Service
	taskSvc  *canvasTaskSvc.Service
}

type CanvasTaskStatus struct {
	ID           string    `json:"id"`
	CanvasID     string    `json:"canvasId"`
	NodeID       string    `json:"nodeId"`
	ProjectID    string    `json:"projectId"`
	TaskType     string    `json:"taskType"`
	Provider     string    `json:"provider"`
	Model        string    `json:"model"`
	Prompt       string    `json:"prompt"`
	Status       int       `json:"status"`
	StatusText   string    `json:"statusText"`
	ResultId     string    `json:"resultId"`
	ResultURL    string    `json:"resultUrl"`
	ErrorMessage string    `json:"errorMessage"`
	Progress     int       `json:"progress"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

func NewImageHandler(svc *ai_image.Service, taskSvc *canvasTaskSvc.Service) *AIImageHandler {
	return &AIImageHandler{imageSvc: svc, taskSvc: taskSvc}
}

type GenerateImageRequest struct {
	CanvasID        string               `json:"canvasId,omitempty"`
	NodeID          string               `json:"nodeId,omitempty"`
	Prompt          string               `json:"prompt" validate:"required"`
	Model           string               `json:"model" validate:"required"`
	Resolution      aioptions.Resolution `json:"resolution"`
	Quality         string               `json:"quality,omitempty"`
	N               int                  `json:"n,omitempty"`
	ReferenceImages []string             `json:"referenceImages,omitempty"`
	AspectRatio     string               `json:"aspectRatio,omitempty"`
	Workspace       string               `json:"workspace"`
	PromptType      string               `json:"promptType,omitempty"`
}

func (h *AIImageHandler) InitHandler(api iris.Party) {
	api.Post("/projects/:projectId/images/generate", h.Generate)
	api.Get("/projects/:projectId/images/models", h.GetModels)
	api.Get("/projects/:projectId/images/task", h.GetTask)
	api.Get("/projects/:projectId/images/prompt-types", h.GetPromptTypes)
}

func (h *AIImageHandler) Generate(ctx iris.Context) {
	projectID := ctx.Params().GetString("projectId")

	req, ok := validator.ParseAndValidate[GenerateImageRequest](ctx)
	if !ok {
		return
	}
	if req.N < 0 {
		req.N = 1
	}

	if len(req.ReferenceImages) > 0 {
		for i, fileUrl := range req.ReferenceImages {
			if !strings.HasPrefix(fileUrl, "http://") && !strings.HasPrefix(fileUrl, "https://") {
				req.ReferenceImages[i] = "http://127.0.0.1:17781" + fileUrl
			}
		}
	}

	if req.Workspace == "" {
		req.Workspace = "24abc74312f3960a"
	}

	imageReq := ai_image.GenerationRequest{
		Prompt:          req.Prompt,
		Model:           req.Model,
		Resolution:      req.Resolution.String(),
		ReferenceImages: req.ReferenceImages,
		AspectRatio:     req.AspectRatio,
		Workspace:       req.Workspace,
		PromptType:      req.PromptType,
	}

	aiTask, err := h.imageSvc.NewTask(context.Background(), imageReq)
	if err != nil {
		validator.InternalServerError(ctx, err)
		return
	}

	var canvasTask *model.CanvasTask
	canvasTask, err = h.taskSvc.CreateTask(
		canvasTaskSvc.CreateTaskRequest{
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
				"resolution":  req.Resolution.String(),
				"quality":     req.Quality,
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

func (h *AIImageHandler) GetTask(ctx iris.Context) {
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

	task, err := h.imageSvc.GetTask(context.Background(), taskId)
	if err != nil {
		validator.InternalServerError(ctx, err)
	} else {
		validator.Success(ctx, task)
	}
}

func (h *AIImageHandler) GetModels(ctx iris.Context) {
	models := h.imageSvc.GetModels(context.Background())
	validator.Success(ctx, models)
}

func (h *AIImageHandler) GetPromptTypes(ctx iris.Context) {
	validator.Success(ctx, h.imageSvc.GetPromptTypes())
}
