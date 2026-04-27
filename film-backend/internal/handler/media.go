package handler

import (
	"github.com/kataras/iris/v12"
	"open-film-service/internal/model"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/media"
)

type MediaHandler struct {
	svc *media.Service
}

func NewMediaHandler(svc *media.Service) *MediaHandler {
	return &MediaHandler{svc: svc}
}

type CreateMediaRequest struct {
	MediaType model.MediaType `json:"media_type" validate:"required"`
	TaskType  string          `json:"task_type" validate:"required"`
	Prompt    string          `json:"prompt" validate:"required"`
	Params    string          `json:"params"`
}

func (h *MediaHandler) Create(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")
	req, ok := validator.ParseAndValidate[CreateMediaRequest](ctx)
	if !ok {
		return
	}

	task, err := h.svc.Create(projectID, req.MediaType, req.TaskType, req.Prompt, req.Params)
	if validator.InternalServerError(ctx, err) {
		return
	}

	ctx.StatusCode(201)
	validator.Success(ctx, task)
}

func (h *MediaHandler) Get(ctx iris.Context) {
	id := ctx.Params().GetString("id")

	task, err := h.svc.GetByID(id)
	if err != nil {
		validator.NotFoundError(ctx, "not found")
		return
	}
	validator.Success(ctx, task)
}

func (h *MediaHandler) List(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")
	mediaType := model.MediaType(ctx.URLParam("media_type"))

	tasks, err := h.svc.ListByProjectID(projectID, mediaType)
	if validator.InternalServerError(ctx, err) {
		return
	}
	validator.Success(ctx, tasks)
}
