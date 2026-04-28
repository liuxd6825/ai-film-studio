package handler

import (
	"errors"
	"open-film-service/internal/service/ai_video"
	"strconv"
	"strings"

	"open-film-service/internal/pkg/validator"

	"github.com/kataras/iris/v12"
)

type AIVideoHandler struct {
	svc     *ai_video.Service
	taskSvc *CanvasTaskHandler
}

func NewAIVideoHandler(svc *ai_video.Service, taskSvc *CanvasTaskHandler) *AIVideoHandler {
	return &AIVideoHandler{
		svc:     svc,
		taskSvc: taskSvc,
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

	aiReq := ai_video.GenerationRequest{
		Prompt:         req.Prompt,
		Model:          model,
		Duration:       req.Duration,
		Fps:            strconv.Itoa(req.FPS),
		ReferenceFiles: req.ReferenceFiles,
		AspectRatio:    req.AspectRatio,
	}
	aiResp, err := h.svc.Generate(ctx, aiReq)
	if err != nil {
		validator.InternalServerError(ctx, err)
		return
	}

	response := AIGenerateVideoResponse{}

	if h.taskSvc != nil && req.NodeID != "" {
		task, createErr := h.taskSvc.CreateTask(
			projectID,
			req.CanvasID,
			req.NodeID,
			aiResp.ResultId,
			aiResp.ResultUrl,
			"video_generation",
			"jimeng",
			model,
			req.Prompt,
			map[string]interface{}{
				"prompt":         req.Prompt,
				"model":          model,
				"duration":       req.Duration,
				"fps":            req.FPS,
				"referenceFiles": req.ReferenceFiles,
				"aspectRatio":    req.AspectRatio,
			},
		)
		if createErr == nil && task != nil {
			response.TaskID = task.ID
			response.ResultID = aiResp.ResultId
			response.ResultURL = aiResp.ResultUrl
			response.Status = task.Status
		}
	}

	validator.Success(ctx, response)
}
