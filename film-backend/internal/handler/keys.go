package handler

import (
	"github.com/kataras/iris/v12"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/keys"
)

type KeysHandler struct {
	svc *keys.Service
}

func NewKeysHandler(svc *keys.Service) *KeysHandler {
	return &KeysHandler{svc: svc}
}

type CreateKeyRequest struct {
	Name      string `json:"name" validate:"required,maxLen=255"`
	KeyHash   string `json:"key_hash" validate:"required"`
	ExpiresAt int64  `json:"expires_at"`
}

func (h *KeysHandler) Create(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")
	req, ok := validator.ParseAndValidate[CreateKeyRequest](ctx)
	if !ok {
		return
	}

	apiKey, err := h.svc.Create(projectID, req.Name, req.KeyHash, req.ExpiresAt)
	if validator.InternalServerError(ctx, err) {
		return
	}

	ctx.StatusCode(201)
	validator.Success(ctx, apiKey)
}

func (h *KeysHandler) List(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")
	apiKeys, err := h.svc.ListByProjectID(projectID)
	if validator.InternalServerError(ctx, err) {
		return
	}
	validator.Success(ctx, apiKeys)
}

func (h *KeysHandler) Delete(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	if validator.InternalServerError(ctx, h.svc.Delete(id)) {
		return
	}
	validator.SuccessWithMessage(ctx, "deleted")
}
