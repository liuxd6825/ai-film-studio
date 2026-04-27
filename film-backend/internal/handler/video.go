package handler

import (
	"github.com/kataras/iris/v12"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/video"
)

type VideoHandler struct {
	svc *video.Service
}

func NewVideoHandler(svc *video.Service) *VideoHandler {
	return &VideoHandler{svc: svc}
}

type CreateVideoRequest struct {
	TaskType string `json:"task_type" validate:"required"`
	Prompt   string `json:"prompt" validate:"required"`
	Params   string `json:"params"`
}

func (h *VideoHandler) Create(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")
	req, ok := validator.ParseAndValidate[CreateVideoRequest](ctx)
	if !ok {
		return
	}

	task, err := h.svc.Create(projectID, req.TaskType, req.Prompt, req.Params)
	if validator.InternalServerError(ctx, err) {
		return
	}

	ctx.StatusCode(201)
	validator.Success(ctx, task)
}

func (h *VideoHandler) Get(ctx iris.Context) {
	id := ctx.Params().GetString("id")

	task, err := h.svc.GetByID(id)
	if err != nil {
		validator.NotFoundError(ctx, "not found")
		return
	}
	validator.Success(ctx, task)
}
