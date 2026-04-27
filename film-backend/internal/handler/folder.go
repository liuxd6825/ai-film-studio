package handler

import (
	"github.com/kataras/iris/v12"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/folder"
)

type FolderHandler struct {
	svc *folder.Service
}

func NewFolderHandler(svc *folder.Service) *FolderHandler {
	return &FolderHandler{svc: svc}
}

type CreateFolderRequest struct {
	Name     string  `json:"name" validate:"required,maxLen=255"`
	ParentID *string `json:"parentId"`
}

type UpdateFolderRequest struct {
	Name     string  `json:"name" validate:"required,maxLen=255"`
	ParentID *string `json:"parentId"`
}

func (h *FolderHandler) Create(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")
	req, ok := validator.ParseAndValidate[CreateFolderRequest](ctx)
	if !ok {
		return
	}

	f, err := h.svc.Create(projectID, req.Name, req.ParentID)
	if validator.InternalServerError(ctx, err) {
		return
	}

	ctx.StatusCode(201)
	validator.Success(ctx, f)
}

func (h *FolderHandler) List(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")
	folders, err := h.svc.GetByProjectID(projectID)
	if validator.InternalServerError(ctx, err) {
		return
	}
	validator.Success(ctx, folders)
}

func (h *FolderHandler) Get(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	f, err := h.svc.GetByID(id)
	if err != nil {
		validator.NotFoundError(ctx, "folder not found")
		return
	}
	validator.Success(ctx, f)
}

func (h *FolderHandler) Update(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	req, ok := validator.ParseAndValidate[UpdateFolderRequest](ctx)
	if !ok {
		return
	}

	f, err := h.svc.Update(id, req.Name, req.ParentID)
	if err != nil {
		if err == folder.ErrNotFound || err == folder.ErrInvalidUUID {
			validator.NotFoundError(ctx, "folder not found")
			return
		}
		if validator.InternalServerError(ctx, err) {
			return
		}
		return
	}
	validator.Success(ctx, f)
}

func (h *FolderHandler) Delete(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	if validator.InternalServerError(ctx, h.svc.Delete(id)) {
		return
	}
	validator.SuccessWithMessage(ctx, "deleted")
}
