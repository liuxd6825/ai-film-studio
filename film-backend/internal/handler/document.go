package handler

import (
	"github.com/kataras/iris/v12"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/document"
)

type DocumentHandler struct {
	svc *document.Service
}

func NewDocumentHandler(svc *document.Service) *DocumentHandler {
	return &DocumentHandler{svc: svc}
}

type CreateDocumentRequest struct {
	Title    string  `json:"title" validate:"required,maxLen=255"`
	Content  string  `json:"content"`
	ParentID *string `json:"parent_id"`
}

type UpdateDocumentRequest struct {
	Title    string  `json:"title" validate:"required,maxLen=255"`
	Content  string  `json:"content"`
	ParentID *string `json:"parent_id"`
}

func (h *DocumentHandler) Create(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")
	req, ok := validator.ParseAndValidate[CreateDocumentRequest](ctx)
	if !ok {
		return
	}

	doc, err := h.svc.Create(projectID, req.Title, req.Content, req.ParentID)
	if validator.InternalServerError(ctx, err) {
		return
	}

	ctx.StatusCode(201)
	validator.Success(ctx, doc)
}

func (h *DocumentHandler) List(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")
	docs, err := h.svc.GetByProjectID(projectID)
	if validator.InternalServerError(ctx, err) {
		return
	}
	validator.Success(ctx, docs)
}

func (h *DocumentHandler) Get(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	doc, err := h.svc.GetByID(id)
	if err != nil {
		validator.NotFoundError(ctx, "document not found")
		return
	}
	validator.Success(ctx, doc)
}

func (h *DocumentHandler) Update(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	req, ok := validator.ParseAndValidate[UpdateDocumentRequest](ctx)
	if !ok {
		return
	}

	doc, err := h.svc.Update(id, req.Title, req.Content, req.ParentID)
	if err != nil {
		if err == document.ErrNotFound {
			validator.NotFoundError(ctx, "document not found")
			return
		}
		if validator.InternalServerError(ctx, err) {
			return
		}
		return
	}
	validator.Success(ctx, doc)
}

func (h *DocumentHandler) Delete(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	if validator.InternalServerError(ctx, h.svc.Delete(id)) {
		return
	}
	validator.SuccessWithMessage(ctx, "deleted")
}
