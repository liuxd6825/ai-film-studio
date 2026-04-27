package handler

import (
	"github.com/kataras/iris/v12"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/models"
)

type ModelsHandler struct {
	svc *models.Service
}

func NewModelsHandler(svc *models.Service) *ModelsHandler {
	return &ModelsHandler{svc: svc}
}

type CreateModelRequest struct {
	Provider     string `json:"provider" validate:"required,maxLen=100"`
	ModelName    string `json:"model_name" validate:"required,maxLen=255"`
	EncryptedKey string `json:"encrypted_key"`
	BaseURL      string `json:"base_url" validate:"maxLen=500"`
	Settings     string `json:"settings"`
	Priority     int    `json:"priority"`
}

type UpdateModelRequest struct {
	Provider     string `json:"provider" validate:"required,maxLen=100"`
	ModelName    string `json:"model_name" validate:"required,maxLen=255"`
	EncryptedKey string `json:"encrypted_key"`
	BaseURL      string `json:"base_url" validate:"maxLen=500"`
	Settings     string `json:"settings"`
	Priority     int    `json:"priority"`
}

func (h *ModelsHandler) Create(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")
	req, ok := validator.ParseAndValidate[CreateModelRequest](ctx)
	if !ok {
		return
	}

	cfg, err := h.svc.Create(projectID, req.Provider, req.ModelName, req.EncryptedKey, req.BaseURL, req.Settings, req.Priority)
	if validator.InternalServerError(ctx, err) {
		return
	}

	ctx.StatusCode(201)
	validator.Success(ctx, cfg)
}

func (h *ModelsHandler) List(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")
	cfgs, err := h.svc.ListByProjectID(projectID)
	if validator.InternalServerError(ctx, err) {
		return
	}
	validator.Success(ctx, cfgs)
}

func (h *ModelsHandler) Update(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	req, ok := validator.ParseAndValidate[UpdateModelRequest](ctx)
	if !ok {
		return
	}

	if validator.InternalServerError(ctx, h.svc.Update(id, req.Provider, req.ModelName, req.EncryptedKey, req.BaseURL, req.Settings, req.Priority)) {
		return
	}
	validator.SuccessWithMessage(ctx, "updated")
}

func (h *ModelsHandler) Delete(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	if validator.InternalServerError(ctx, h.svc.Delete(id)) {
		return
	}
	validator.SuccessWithMessage(ctx, "deleted")
}
