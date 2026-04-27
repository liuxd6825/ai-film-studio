package handler

import (
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/ai_jimeng"
	"open-film-service/internal/service/project"

	"github.com/kataras/iris/v12"
)

type JimengHandler struct {
	svc        *ai_jimeng.Service
	projectSvc *project.Service
}

func NewJimengHandler(svc *ai_jimeng.Service, projectSvc *project.Service) *JimengHandler {
	return &JimengHandler{
		svc:        svc,
		projectSvc: projectSvc,
	}
}

type GenerateVideoRequest struct {
	Prompt          string   `json:"prompt" validate:"required"`
	Model           string   `json:"model"`
	AspectRatio     string   `json:"aspect_ratio"`
	Seed            string   `json:"seed"`
	ReferenceType   string   `json:"reference_type"`
	ReferenceImages []string `json:"reference_images"`
}

type GenerateVideoResponse struct {
	ResultID  string `json:"result_id"`
	ResultURL string `json:"result_url"`
	Result    string `json:"result"`
}

type VideoTaskResponse struct {
	ID      string   `json:"id"`
	Type    string   `json:"type"`
	Status  string   `json:"status"`
	Desc    string   `json:"desc"`
	Results []string `json:"results"`
}

type VideoResultResponse struct {
	RequestID string              `json:"request_id"`
	Tasks     []VideoTaskResponse `json:"tasks"`
}

/*
func (h *JimengHandler) Generate(ctx iris.Context) {
	projectID := ctx.Params().GetString("projectId")
	if projectID == "" {
		validator.BadRequestWithField(ctx, "projectId", "projectId is required")
		return
	}

	proj, err := h.projectSvc.GetByID(projectID)
	if err != nil {
		validator.NotFoundError(ctx, "project not found")
		return
	}

	workspace := proj.JimengWorkspace
	if workspace == "" {
		validator.BadRequestWithField(ctx, "jimeng_workspace", "jimeng_workspace not configured for this project")
		return
	}

	req, ok := validator.ParseAndValidate[GenerateVideoRequest](ctx)
	if !ok {
		return
	}

	jimengReq := jimeng.GenerateRequest{
		Prompt:      req.Prompt,
		Model:       req.Model,
		AspectRatio: req.AspectRatio,
		Seed:        req.Seed,
		WorkType:    req.ReferenceType,
		FilesUrl:    req.ReferenceImages,
	}

	result, err := h.svc.Generate(ctx.Request().Context(), workspace, jimengReq)
	if err != nil {
		validator.InternalServerError(ctx, err)
		return
	}

	validator.Success(ctx, GenerateVideoResponse{
		ResultID:  result.ResultID,
		ResultURL: result.ResultUrl,
		Result:    result.Result,
	})
}*/

func (h *JimengHandler) GetResult(ctx iris.Context) {
	projectID := ctx.Params().GetString("projectId")
	requestID := ctx.Params().GetString("requestId")

	if projectID == "" || requestID == "" {
		validator.BadRequestWithField(ctx, "params", "project_id and request_id are required")
		return
	}

	proj, err := h.projectSvc.GetByID(projectID)
	if err != nil {
		validator.NotFoundError(ctx, "project not found")
		return
	}

	workspace := proj.JimengWorkspace
	if workspace == "" {
		validator.BadRequestWithField(ctx, "jimeng_workspace", "jimeng_workspace not configured for this project")
		return
	}

	result, err := h.svc.GetResult(ctx.Request().Context(), workspace, requestID)
	if err != nil {
		validator.InternalServerError(ctx, err)
		return
	}

	tasks := make([]VideoTaskResponse, len(result.Tasks))
	for i, task := range result.Tasks {
		tasks[i] = VideoTaskResponse{
			ID:      task.ID,
			Type:    task.Type,
			Status:  task.Status,
			Desc:    task.Desc,
			Results: task.Results,
		}
	}

	validator.Success(ctx, VideoResultResponse{
		RequestID: result.RequestID,
		Tasks:     tasks,
	})
}
