package handler

import (
	"github.com/kataras/iris/v12"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/style"
)

type StyleHandler struct {
	svc *style.Service
}

func NewStyleHandler(svc *style.Service) *StyleHandler {
	return &StyleHandler{svc: svc}
}

type CreateStyleRequest struct {
	Name string `json:"name" validate:"required,maxLen=255"`
}

type UpdateStyleRequest struct {
	Name string `json:"name" validate:"required,maxLen=255"`
}

func (h *StyleHandler) Create(ctx iris.Context) {
	req, ok := validator.ParseAndValidate[CreateStyleRequest](ctx)
	if !ok {
		return
	}

	s, err := h.svc.Create(req.Name)
	if validator.InternalServerError(ctx, err) {
		return
	}

	ctx.StatusCode(201)
	validator.Success(ctx, s)
}

func (h *StyleHandler) List(ctx iris.Context) {
	styles, err := h.svc.List()
	if validator.InternalServerError(ctx, err) {
		return
	}
	validator.Success(ctx, styles)
}

func (h *StyleHandler) Update(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	req, ok := validator.ParseAndValidate[UpdateStyleRequest](ctx)
	if !ok {
		return
	}

	s, err := h.svc.Update(id, req.Name)
	if err != nil {
		if err == style.ErrNotFound || err == style.ErrInvalidUUID {
			validator.NotFoundError(ctx, "style not found")
			return
		}
		validator.InternalServerError(ctx, err)
		return
	}
	validator.Success(ctx, s)
}

func (h *StyleHandler) Delete(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	if validator.InternalServerError(ctx, h.svc.Delete(id)) {
		return
	}
	validator.SuccessWithMessage(ctx, "deleted")
}
