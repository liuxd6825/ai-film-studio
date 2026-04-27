package handler

import (
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/character"

	"github.com/kataras/iris/v12"
)

type CharacterHandler struct {
	svc *character.Service
}

func NewCharacterHandler(svc *character.Service) *CharacterHandler {
	return &CharacterHandler{svc: svc}
}

type CreateCharacterRequest struct {
	OrgID       string `json:"orgId" validate:"required"`
	Name        string `json:"name" validate:"required,maxLen=255"`
	Desc        string `json:"desc"`
	Type        string `json:"type" validate:"maxLen=50"`
	Appearance  string `json:"appearance"`
	Personality string `json:"personality"`
	Background  string `json:"background"`
	Abilities   string `json:"abilities"`
	Faction     string `json:"faction" validate:"maxLen=255"`
}

type UpdateCharacterRequest struct {
	Name        string `json:"name" validate:"maxLen=255"`
	Desc        string `json:"desc"`
	Type        string `json:"type" validate:"maxLen=50"`
	Status      int    `json:"status"`
	Appearance  string `json:"appearance"`
	Personality string `json:"personality"`
	Background  string `json:"background"`
	Abilities   string `json:"abilities"`
	Faction     string `json:"faction" validate:"maxLen=255"`
}

func (h *CharacterHandler) Create(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")

	req, ok := validator.ParseAndValidate[CreateCharacterRequest](ctx)
	if !ok {
		return
	}

	result, err := h.svc.Create(req.OrgID, projectID, req.Name, req.Desc, req.Type, req.Appearance, req.Personality, req.Background, req.Abilities, req.Faction)
	if validator.InternalServerError(ctx, err) {
		return
	}

	ctx.StatusCode(201)
	validator.Success(ctx, result)
}

func (h *CharacterHandler) List(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")

	results, err := h.svc.GetByProjectIDWithCovers(projectID)
	if validator.InternalServerError(ctx, err) {
		return
	}

	validator.Success(ctx, results)
}

func (h *CharacterHandler) Get(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	result, err := h.svc.GetByID(id)
	if err != nil {
		validator.NotFoundError(ctx, "character not found")
		return
	}
	validator.Success(ctx, result)
}

func (h *CharacterHandler) Update(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	req, ok := validator.ParseAndValidate[UpdateCharacterRequest](ctx)
	if !ok {
		return
	}

	result, err := h.svc.Update(id, req.Name, req.Desc, req.Type, req.Status, req.Appearance, req.Personality, req.Background, req.Abilities, req.Faction)
	if err != nil {
		validator.NotFoundError(ctx, "character not found")
		return
	}
	validator.Success(ctx, result)
}

func (h *CharacterHandler) Delete(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	if validator.InternalServerError(ctx, h.svc.Delete(id)) {
		return
	}
	validator.SuccessWithMessage(ctx, "deleted")
}
