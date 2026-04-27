package handler

import (
	"github.com/kataras/iris/v12"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/org"
)

type OrgHandler struct {
	svc *org.Service
}

func NewOrgHandler(svc *org.Service) *OrgHandler {
	return &OrgHandler{svc: svc}
}

type CreateOrgRequest struct {
	Name string `json:"name" validate:"required,maxLen=255"`
}

type UpdateOrgRequest struct {
	Name   string `json:"name" validate:"required,maxLen=255"`
	Status int    `json:"status"`
}

func (h *OrgHandler) Create(ctx iris.Context) {
	req, ok := validator.ParseAndValidate[CreateOrgRequest](ctx)
	if !ok {
		return
	}

	o, err := h.svc.Create(req.Name)
	if validator.InternalServerError(ctx, err) {
		return
	}

	ctx.StatusCode(201)
	validator.Success(ctx, o)
}

func (h *OrgHandler) List(ctx iris.Context) {
	orgs, err := h.svc.List()
	if validator.InternalServerError(ctx, err) {
		return
	}
	validator.Success(ctx, orgs)
}

func (h *OrgHandler) Get(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	o, err := h.svc.GetByID(id)
	if err != nil {
		validator.NotFoundError(ctx, "not found")
		return
	}
	validator.Success(ctx, o)
}

func (h *OrgHandler) Update(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	req, ok := validator.ParseAndValidate[UpdateOrgRequest](ctx)
	if !ok {
		return
	}

	if validator.InternalServerError(ctx, h.svc.Update(id, req.Name, req.Status)) {
		return
	}
	validator.SuccessWithMessage(ctx, "updated")
}
