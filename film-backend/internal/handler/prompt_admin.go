package handler

import (
	"errors"
	"strconv"

	"github.com/google/uuid"
	"github.com/kataras/iris/v12"

	"open-film-service/internal/model"
	"open-film-service/internal/service"
)

type PromptAdminHandler struct {
	svc *service.PromptAdminService
}

func NewPromptAdminHandler(svc *service.PromptAdminService) *PromptAdminHandler {
	return &PromptAdminHandler{svc: svc}
}

type CreateSystemPromptRequest struct {
	ProjectID   string                 `json:"projectId"`
	Title       string                 `json:"title"`
	Content     string                 `json:"content"`
	CategoryKey string                 `json:"categoryKey"`
	Tags        []string               `json:"tags"`
	Variables   []model.PromptVariable `json:"variables"`
	IsSystem    bool                   `json:"isSystem"`
}

func (h *PromptAdminHandler) Create(ctx iris.Context) {
	var req CreateSystemPromptRequest
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

	prompt, err := h.svc.Create(ctx, &service.CreateSystemPromptRequest{
		ProjectID:   projectID,
		Title:       req.Title,
		Content:     req.Content,
		CategoryKey: req.CategoryKey,
		Tags:        req.Tags,
		Variables:   req.Variables,
		IsSystem:    req.IsSystem,
	})
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": err.Error()})
		return
	}

	ctx.JSON(iris.Map{"code": 200, "data": prompt})
}

func (h *PromptAdminHandler) Get(ctx iris.Context) {
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

type ListSystemPromptRequest struct {
	ProjectID   string `url:"projectId"`
	CategoryKey string `url:"categoryKey"`
	Tag         string `url:"tag"`
}

func (h *PromptAdminHandler) List(ctx iris.Context) {
	var req ListSystemPromptRequest
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

	prompts, err := h.svc.List(ctx, projectID, req.CategoryKey, req.Tag)
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": err.Error()})
		return
	}

	ctx.JSON(iris.Map{"code": 200, "data": prompts})
}

type UpdateSystemPromptRequest struct {
	Title       string                 `json:"title"`
	Content     string                 `json:"content"`
	CategoryKey string                 `json:"categoryKey"`
	Tags        []string               `json:"tags"`
	Variables   []model.PromptVariable `json:"variables"`
}

func (h *PromptAdminHandler) Update(ctx iris.Context) {
	idStr := ctx.Params().Get("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid id"})
		return
	}

	var req UpdateSystemPromptRequest
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid request"})
		return
	}

	prompt, err := h.svc.Update(ctx, id, &service.UpdateSystemPromptRequest{
		Title:       req.Title,
		Content:     req.Content,
		CategoryKey: req.CategoryKey,
		Tags:        req.Tags,
		Variables:   req.Variables,
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

func (h *PromptAdminHandler) Delete(ctx iris.Context) {
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

func (h *PromptAdminHandler) GetVersions(ctx iris.Context) {
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

func (h *PromptAdminHandler) RestoreVersion(ctx iris.Context) {
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