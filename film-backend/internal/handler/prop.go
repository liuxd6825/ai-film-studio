package handler

import (
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/prop"

	"github.com/kataras/iris/v12"
)

type PropHandler struct {
	svc *prop.Service
}

func NewPropHandler(svc *prop.Service) *PropHandler {
	return &PropHandler{svc: svc}
}

type CreatePropRequest struct {
	OrgID string `json:"orgId" validate:"required"`
	Name  string `json:"name" validate:"required,maxLen=255"`
	Desc  string `json:"desc"`
	Type  string `json:"type" validate:"maxLen=50"`
}

type UpdatePropRequest struct {
	Name   string `json:"name" validate:"maxLen=255"`
	Desc   string `json:"desc"`
	Type   string `json:"type" validate:"maxLen=50"`
	Status int    `json:"status"`
}

func (h *PropHandler) Create(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")

	req, ok := validator.ParseAndValidate[CreatePropRequest](ctx)
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

func (h *PropHandler) List(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")

	results, err := h.svc.GetByProjectIDWithCovers(projectID)
	if validator.InternalServerError(ctx, err) {
		return
	}

	validator.Success(ctx, results)
}

func (h *PropHandler) Get(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	result, err := h.svc.GetByID(id)
	if err != nil {
		validator.NotFoundError(ctx, "prop not found")
		return
	}
	validator.Success(ctx, result)
}

func (h *PropHandler) Update(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	req, ok := validator.ParseAndValidate[UpdatePropRequest](ctx)
	if !ok {
		return
	}

	result, err := h.svc.Update(id, req.Name, req.Desc, req.Type, req.Status)
	if err != nil {
		validator.NotFoundError(ctx, "prop not found")
		return
	}
	validator.Success(ctx, result)
}

func (h *PropHandler) Delete(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	if validator.InternalServerError(ctx, h.svc.Delete(id)) {
		return
	}
	validator.SuccessWithMessage(ctx, "deleted")
}
