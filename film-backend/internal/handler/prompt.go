package handler

import (
	"errors"
	"strconv"

	"github.com/google/uuid"
	"github.com/kataras/iris/v12"

	"open-film-service/internal/model"
	"open-film-service/internal/service"
)

type PromptHandler struct {
	svc *service.PromptService
}

func NewPromptHandler(svc *service.PromptService) *PromptHandler {
	return &PromptHandler{svc: svc}
}

type CreatePromptRequest struct {
	ProjectID  string                 `json:"projectId"`
	Title      string                 `json:"title"`
	Content    string                 `json:"content"`
	CategoryID string                 `json:"categoryId"`
	Tags       []string               `json:"tags"`
	Variables  []model.PromptVariable `json:"variables"`
}

func (h *PromptHandler) Create(ctx iris.Context) {
	var req CreatePromptRequest
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

	categoryID, _ := uuid.Parse(req.CategoryID)

	prompt, err := h.svc.Create(ctx, &service.CreatePromptRequest{
		ProjectID:  projectID,
		Title:      req.Title,
		Content:    req.Content,
		CategoryID: categoryID,
		Tags:       req.Tags,
		Variables:  req.Variables,
	})
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": err.Error()})
		return
	}

	ctx.JSON(iris.Map{"code": 200, "data": prompt})
}

func (h *PromptHandler) Get(ctx iris.Context) {
	idStr := ctx.Params().Get("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid id"})
		return
	}

	prompt, err := h.svc.GetByID(ctx, id)
	if errors.Is(err, service.ErrPromptNotFound) {
		ctx.StatusCode(404)
		ctx.JSON(iris.Map{"code": 404, "message": "prompt not found"})
		return
	}
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": err.Error()})
		return
	}

	ctx.JSON(iris.Map{"code": 200, "data": prompt})
}

type ListPromptRequest struct {
	ProjectID  string `url:"projectId"`
	CategoryID string `url:"categoryId"`
	Tag        string `url:"tag"`
}

func (h *PromptHandler) List(ctx iris.Context) {
	var req ListPromptRequest
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

	categoryID, _ := uuid.Parse(req.CategoryID)

	prompts, err := h.svc.List(ctx, projectID, categoryID, req.Tag)
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": err.Error()})
		return
	}

	ctx.JSON(iris.Map{"code": 200, "data": prompts})
}

type UpdatePromptRequest struct {
	Title      string                 `json:"title"`
	Content    string                 `json:"content"`
	CategoryID string                 `json:"categoryId"`
	Tags       []string               `json:"tags"`
	Variables  []model.PromptVariable `json:"variables"`
}

func (h *PromptHandler) Update(ctx iris.Context) {
	idStr := ctx.Params().Get("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid id"})
		return
	}

	var req UpdatePromptRequest
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid request"})
		return
	}

	categoryID, _ := uuid.Parse(req.CategoryID)

	prompt, err := h.svc.Update(ctx, id, &service.UpdatePromptRequest{
		Title:      req.Title,
		Content:    req.Content,
		CategoryID: categoryID,
		Tags:       req.Tags,
		Variables:  req.Variables,
	})
	if errors.Is(err, service.ErrPromptNotFound) {
		ctx.StatusCode(404)
		ctx.JSON(iris.Map{"code": 404, "message": "prompt not found"})
		return
	}
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": err.Error()})
		return
	}

	ctx.JSON(iris.Map{"code": 200, "data": prompt})
}

func (h *PromptHandler) Delete(ctx iris.Context) {
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

func (h *PromptHandler) GetVersions(ctx iris.Context) {
	idStr := ctx.Params().Get("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid id"})
		return
	}

	versions, err := h.svc.GetVersions(ctx, id)
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": err.Error()})
		return
	}

	ctx.JSON(iris.Map{"code": 200, "data": versions})
}

func (h *PromptHandler) RestoreVersion(ctx iris.Context) {
	idStr := ctx.Params().Get("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid id"})
		return
	}

	versionStr := ctx.Params().Get("version")
	version, err := strconv.Atoi(versionStr)
	if err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid version"})
		return
	}

	prompt, err := h.svc.RestoreVersion(ctx, id, version)
	if errors.Is(err, service.ErrVersionNotFound) {
		ctx.StatusCode(404)
		ctx.JSON(iris.Map{"code": 404, "message": "version not found"})
		return
	}
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": err.Error()})
		return
	}

	ctx.JSON(iris.Map{"code": 200, "data": prompt})
}
