package handler

import (
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/dictionary"

	"github.com/kataras/iris/v12"
)

type DictionaryHandler struct {
	svc *dictionary.Service
}

func NewDictionaryHandler(svc *dictionary.Service) *DictionaryHandler {
	return &DictionaryHandler{svc: svc}
}

type CreateDictionaryRequest struct {
	Category  string `json:"category" validate:"required,maxLen=50"`
	Key       string `json:"key" validate:"required,maxLen=100"`
	Value     string `json:"value" validate:"required,maxLen=255"`
	SortOrder int    `json:"sortOrder"`
}

type UpdateDictionaryRequest struct {
	Category  string `json:"category" validate:"maxLen=50"`
	Key       string `json:"key" validate:"maxLen=100"`
	Value     string `json:"value" validate:"maxLen=255"`
	SortOrder int    `json:"sortOrder"`
}

func (h *DictionaryHandler) Create(ctx iris.Context) {
	orgID := ctx.Params().GetString("org_id")
	req, ok := validator.ParseAndValidate[CreateDictionaryRequest](ctx)
	if !ok {
		return
	}

	result, err := h.svc.Create(orgID, req.Category, req.Key, req.Value, req.SortOrder)
	if validator.InternalServerError(ctx, err) {
		return
	}

	ctx.StatusCode(201)
	validator.Success(ctx, result)
}

func (h *DictionaryHandler) List(ctx iris.Context) {
	orgID := ctx.Params().GetString("org_id")
	category := ctx.URLParamDefault("category", "")

	var results interface{}
	var err error

	if category != "" {
		results, err = h.svc.GetByCategory(orgID, category)
	} else {
		results, err = h.svc.GetByOrgID(orgID)
	}

	if validator.InternalServerError(ctx, err) {
		return
	}

	validator.Success(ctx, results)
}

func (h *DictionaryHandler) Get(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	result, err := h.svc.GetByID(id)
	if err != nil {
		validator.NotFoundError(ctx, "dictionary not found")
		return
	}
	validator.Success(ctx, result)
}

func (h *DictionaryHandler) Update(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	req, ok := validator.ParseAndValidate[UpdateDictionaryRequest](ctx)
	if !ok {
		return
	}

	result, err := h.svc.Update(id, req.Category, req.Key, req.Value, req.SortOrder)
	if err != nil {
		validator.NotFoundError(ctx, "dictionary not found")
		return
	}
	validator.Success(ctx, result)
}

func (h *DictionaryHandler) Delete(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	if validator.InternalServerError(ctx, h.svc.Delete(id)) {
		return
	}
	validator.SuccessWithMessage(ctx, "deleted")
}
