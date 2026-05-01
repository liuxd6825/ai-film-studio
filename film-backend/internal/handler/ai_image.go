package handler

import (
	"context"
	"errors"
	"open-film-service/internal/model"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/ai_image"
	"strings"
	"time"

	"github.com/kataras/iris/v12"
)

type AIImageHandler struct {
	imageSvc *ai_image.Service
	taskSvc  *CanvasTaskHandler
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

func NewImageHandler(svc *ai_image.Service, taskSvc *CanvasTaskHandler) *AIImageHandler {
	return &AIImageHandler{imageSvc: svc, taskSvc: taskSvc}
}

type GenerateImageRequest struct {
	CanvasID        string   `json:"canvasId,omitempty"`
	NodeID          string   `json:"nodeId,omitempty"`
	Prompt          string   `json:"prompt" validate:"required"`
	Model           string   `json:"model"`
	Size            string   `json:"size"`
	Quality         string   `json:"quality,omitempty"`
	N               int      `json:"n,omitempty"`
	ReferenceImages []string `json:"referenceImages,omitempty"`
	AspectRatio     string   `json:"aspectRatio,omitempty"`
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

	size := ai_image.ImageSize(req.Size)
	if size == "" {
		size = ai_image.Size2K
	}

	imageReq := ai_image.GenerationRequest{
		Prompt:          req.Prompt,
		Model:           req.Model,
		Size:            size,
		Quality:         req.Quality,
		N:               req.N,
		ReferenceImages: req.ReferenceImages,
		AspectRatio:     req.AspectRatio,
	}

	aiTask, err := h.imageSvc.NewTask(context.Background(), imageReq)
	if err != nil {
		validator.InternalServerError(ctx, err)
		return
	}

	response := model.CanvasTask{
		ID:       aiTask.TaskId,
		Model:    aiTask.Model,
		Provider: aiTask.Provider,
	}

	if h.taskSvc != nil && req.NodeID != "" {
		_, createErr := h.taskSvc.CreateTask(aiTask.TaskId, projectID, req.CanvasID, req.NodeID, aiTask.TaskType, aiTask.Provider, aiTask.Model, req.Prompt, map[string]any{
			"size":        req.Size,
			"quality":     req.Quality,
			"aspectRatio": req.AspectRatio,
		})
		if createErr != nil {
			validator.InternalServerError(ctx, createErr)
			return
		}
	}

	validator.Success(ctx, response)
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
