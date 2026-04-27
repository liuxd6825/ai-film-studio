package handler

import (
	"errors"

	"github.com/google/uuid"
	"github.com/kataras/iris/v12"

	"open-film-service/internal/service"
)

type CategoryHandler struct {
	svc *service.CategoryService
}

func NewCategoryHandler(svc *service.CategoryService) *CategoryHandler {
	return &CategoryHandler{svc: svc}
}

type CreateCategoryRequest struct {
	ProjectID string `json:"projectId"`
	Name      string `json:"name"`
}

func (h *CategoryHandler) Create(ctx iris.Context) {
	var req CreateCategoryRequest
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid request"})
		return
	}

	projectID, err := uuid.Parse(req.ProjectID)
	if err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid projectId"})
		return
	}

	category, err := h.svc.Create(ctx, &service.CreateCategoryRequest{
		ProjectID: projectID,
		Name:      req.Name,
	})
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": err.Error()})
		return
	}

	ctx.JSON(iris.Map{"code": 200, "data": category})
}

func (h *CategoryHandler) Get(ctx iris.Context) {
	idStr := ctx.Params().Get("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid id"})
		return
	}

	category, err := h.svc.GetByID(ctx, id)
	if errors.Is(err, service.ErrCategoryNotFound) {
		ctx.StatusCode(404)
		ctx.JSON(iris.Map{"code": 404, "message": "category not found"})
		return
	}
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": err.Error()})
		return
	}

	ctx.JSON(iris.Map{"code": 200, "data": category})
}

type ListCategoryRequest struct {
	ProjectID string `url:"projectId"`
}

func (h *CategoryHandler) List(ctx iris.Context) {
	var req ListCategoryRequest
	if err := ctx.ReadQuery(&req); err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid request"})
		return
	}

	projectID, err := uuid.Parse(req.ProjectID)
	if err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid projectId"})
		return
	}

	categories, err := h.svc.List(ctx, projectID)
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": err.Error()})
		return
	}

	ctx.JSON(iris.Map{"code": 200, "data": categories})
}

type UpdateCategoryRequest struct {
	Name string `json:"name"`
}

func (h *CategoryHandler) Update(ctx iris.Context) {
	idStr := ctx.Params().Get("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid id"})
		return
	}

	var req UpdateCategoryRequest
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid request"})
		return
	}

	category, err := h.svc.Update(ctx, id, &service.UpdateCategoryRequest{
		Name: req.Name,
	})
	if errors.Is(err, service.ErrCategoryNotFound) {
		ctx.StatusCode(404)
		ctx.JSON(iris.Map{"code": 404, "message": "category not found"})
		return
	}
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": err.Error()})
		return
	}

	ctx.JSON(iris.Map{"code": 200, "data": category})
}

func (h *CategoryHandler) Delete(ctx iris.Context) {
	idStr := ctx.Params().Get("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid id"})
		return
	}

	if err := h.svc.Delete(ctx, id); err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": err.Error()})
		return
	}

	ctx.JSON(iris.Map{"code": 200, "message": "deleted"})
}
