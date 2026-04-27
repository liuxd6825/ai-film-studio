package handler

import (
	"open-film-service/internal/model"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/ai_image"
	"strings"
	"time"

	"github.com/kataras/iris/v12"
)

type ImageHandler struct {
	svc     *ai_image.Service
	taskSvc *CanvasTaskHandler
}

func NewImageHandler(svc *ai_image.Service, taskSvc *CanvasTaskHandler) *ImageHandler {
	return &ImageHandler{svc: svc, taskSvc: taskSvc}
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

type GenerateImageResponse struct {
	TaskID           string `json:"taskId,omitempty"`
	ID               string `json:"id"`
	ImageURL         string `json:"imageUrl"`
	ImageData        string `json:"imageData,omitempty"`
	AspectRatio      string `json:"aspectRatio"`
	ProcessingTimeMs int64  `json:"processingTimeMs"`
	Model            string `json:"model"`
	Provider         string `json:"provider"`
}

func (h *ImageHandler) Generate(ctx iris.Context) {
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
		Provider:        "",
		APIKey:          "",
		BaseURL:         "",
		ReferenceImages: req.ReferenceImages,
		AspectRatio:     req.AspectRatio,
	}

	result, err := h.svc.Generate(ctx.Request().Context(), imageReq)
	if err != nil {
		validator.InternalServerError(ctx, err)
		return
	}

	response := GenerateImageResponse{
		ID:               result.ID,
		ImageURL:         result.ImageURL,
		ImageData:        result.ImageData,
		AspectRatio:      result.AspectRatio,
		ProcessingTimeMs: result.ProcessingTimeMs,
		Model:            result.Model,
		Provider:         result.Provider,
	}

	if h.taskSvc != nil && req.NodeID != "" {
		task, createErr := h.taskSvc.CreateTask(projectID, req.CanvasID, req.NodeID, result.ResultId, result.ResultUrl, "image_generation", result.Provider, result.Model, req.Prompt, map[string]interface{}{
			"size":        req.Size,
			"quality":     req.Quality,
			"aspectRatio": req.AspectRatio,
		})
		if createErr == nil && task != nil {
			response.TaskID = task.ID
			if result.ImageURL != "" {
				if err := h.taskSvc.CompleteTask(ctx.Request().Context(), task.ID, []*model.CanvasTaskResult{
					{ResultID: result.ResultId, URL: result.ImageURL, MimeType: "image/png"},
				}); err != nil {
					validator.InternalServerError(ctx, err)
					return
				}
			}
		}
	}

	validator.Success(ctx, response)
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
