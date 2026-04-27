package handler

import (
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/scene"

	"github.com/kataras/iris/v12"
)

type SceneHandler struct {
	svc *scene.Service
}

func NewSceneHandler(svc *scene.Service) *SceneHandler {
	return &SceneHandler{svc: svc}
}

type CreateSceneRequest struct {
	OrgID string `json:"orgId" validate:"required"`
	Name  string `json:"name" validate:"required,maxLen=255"`
	Desc  string `json:"desc"`
	Type  string `json:"type" validate:"maxLen=50"`
}

type UpdateSceneRequest struct {
	Name   string `json:"name" validate:"maxLen=255"`
	Desc   string `json:"desc"`
	Type   string `json:"type" validate:"maxLen=50"`
	Status int    `json:"status"`
}

func (h *SceneHandler) Create(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")

	req, ok := validator.ParseAndValidate[CreateSceneRequest](ctx)
	if !ok {
		return
	}

	result, err := h.svc.Create(req.OrgID, projectID, req.Name, req.Desc, req.Type)
	if validator.InternalServerError(ctx, err) {
		return
	}

	ctx.StatusCode(201)
	validator.Success(ctx, result)
}

func (h *SceneHandler) List(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")

	results, err := h.svc.GetByProjectIDWithCovers(projectID)
	if validator.InternalServerError(ctx, err) {
		return
	}

	validator.Success(ctx, results)
}

func (h *SceneHandler) Get(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	result, err := h.svc.GetByID(id)
	if err != nil {
		validator.NotFoundError(ctx, "scene not found")
		return
	}
	validator.Success(ctx, result)
}

func (h *SceneHandler) Update(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	req, ok := validator.ParseAndValidate[UpdateSceneRequest](ctx)
	if !ok {
		return
	}

	result, err := h.svc.Update(id, req.Name, req.Desc, req.Type, req.Status)
	if err != nil {
		validator.NotFoundError(ctx, "scene not found")
		return
	}
	validator.Success(ctx, result)
}

func (h *SceneHandler) Delete(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	if validator.InternalServerError(ctx, h.svc.Delete(id)) {
		return
	}
	validator.SuccessWithMessage(ctx, "deleted")
}
