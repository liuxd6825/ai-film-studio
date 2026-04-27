package handler

import (
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/image_session"

	"github.com/kataras/iris/v12"
)

type ImageSessionHandler struct {
	svc *image_session.Service
}

func NewImageSessionHandler(svc *image_session.Service) *ImageSessionHandler {
	return &ImageSessionHandler{svc: svc}
}

type CreateImageSessionRequest struct {
	Name string `json:"name" validate:"required,maxLen=255"`
}

func (h *ImageSessionHandler) Create(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")
	orgID := ctx.Params().GetString("org_id")

	req, ok := validator.ParseAndValidate[CreateImageSessionRequest](ctx)
	if !ok {
		return
	}

	result, err := h.svc.Create(orgID, projectID, req.Name)
	if validator.InternalServerError(ctx, err) {
		return
	}

	ctx.StatusCode(201)
	validator.Success(ctx, result)
}

func (h *ImageSessionHandler) List(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")

	results, err := h.svc.GetByProjectID(projectID)
	if validator.InternalServerError(ctx, err) {
		return
	}

	validator.Success(ctx, results)
}

func (h *ImageSessionHandler) Get(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	result, err := h.svc.GetByID(id)
	if err != nil {
		validator.NotFoundError(ctx, "image session not found")
		return
	}
	validator.Success(ctx, result)
}

func (h *ImageSessionHandler) Delete(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	if validator.InternalServerError(ctx, h.svc.Delete(id)) {
		return
	}
	validator.SuccessWithMessage(ctx, "deleted")
}
