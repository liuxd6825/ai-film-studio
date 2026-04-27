package handler

import (
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/visual_image"

	"github.com/kataras/iris/v12"
)

type VisualImageHandler struct {
	svc *visual_image.Service
}

func NewVisualImageHandler(svc *visual_image.Service) *VisualImageHandler {
	return &VisualImageHandler{svc: svc}
}

type CreateVisualImageRequest struct {
	Name           string  `json:"name" validate:"required,maxLen=255"`
	Desc           string  `json:"desc"`
	URL            string  `json:"url" validate:"maxLen=500"`
	Thumbnail      string  `json:"thumbnail" validate:"maxLen=500"`
	VisualObjectID *string `json:"visualObjectId"`
}

type UpdateVisualImageRequest struct {
	Name           string  `json:"name" validate:"maxLen=255"`
	Desc           string  `json:"desc"`
	URL            string  `json:"url" validate:"maxLen=500"`
	Thumbnail      string  `json:"thumbnail" validate:"maxLen=500"`
	VisualObjectID *string `json:"visualObjectId"`
}

type SetCoverImageRequest struct {
	ImageID string `json:"imageId" validate:"required"`
}

func (h *VisualImageHandler) Create(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")
	orgID := ctx.Params().GetString("org_id")

	req, ok := validator.ParseAndValidate[CreateVisualImageRequest](ctx)
	if !ok {
		return
	}

	result, err := h.svc.Create(orgID, projectID, req.Name, req.Desc, req.URL, req.Thumbnail, req.VisualObjectID)
	if validator.InternalServerError(ctx, err) {
		return
	}

	ctx.StatusCode(201)
	validator.Success(ctx, result)
}

func (h *VisualImageHandler) List(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")

	results, err := h.svc.GetByProjectID(projectID)
	if validator.InternalServerError(ctx, err) {
		return
	}

	validator.Success(ctx, results)
}

func (h *VisualImageHandler) Get(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	result, err := h.svc.GetByID(id)
	if err != nil {
		validator.NotFoundError(ctx, "visual image not found")
		return
	}
	validator.Success(ctx, result)
}

func (h *VisualImageHandler) Update(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	req, ok := validator.ParseAndValidate[UpdateVisualImageRequest](ctx)
	if !ok {
		return
	}

	result, err := h.svc.Update(id, req.Name, req.Desc, req.URL, req.Thumbnail, req.VisualObjectID)
	if err != nil {
		validator.NotFoundError(ctx, "visual image not found")
		return
	}
	validator.Success(ctx, result)
}

func (h *VisualImageHandler) Delete(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	if validator.InternalServerError(ctx, h.svc.Delete(id)) {
		return
	}
	validator.SuccessWithMessage(ctx, "deleted")
}

func (h *VisualImageHandler) SetCover(ctx iris.Context) {
	visualObjectID := ctx.Params().GetString("id")

	req, ok := validator.ParseAndValidate[SetCoverImageRequest](ctx)
	if !ok {
		return
	}

	if err := h.svc.SetCoverImage(req.ImageID, visualObjectID); err != nil {
		validator.InternalServerError(ctx, err)
		return
	}

	validator.SuccessWithMessage(ctx, "cover updated")
}
