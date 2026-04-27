package handler

import (
	"github.com/kataras/iris/v12"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/skill"
)

type SkillHandler struct {
	svc *skill.Service
}

func NewSkillHandler(svc *skill.Service) *SkillHandler {
	return &SkillHandler{svc: svc}
}

type CreateSkillRequest struct {
	Name        string `json:"name" validate:"required,maxLen=255"`
	Description string `json:"description"`
	Type        string `json:"type"`
	Config      string `json:"config"`
}

type UpdateSkillRequest struct {
	Name        string `json:"name" validate:"required,maxLen=255"`
	Description string `json:"description"`
	Config      string `json:"config"`
}

func (h *SkillHandler) Create(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")
	req, ok := validator.ParseAndValidate[CreateSkillRequest](ctx)
	if !ok {
		return
	}

	s, err := h.svc.Create(projectID, req.Name, req.Description, req.Type, req.Config)
	if validator.InternalServerError(ctx, err) {
		return
	}

	ctx.StatusCode(201)
	validator.Success(ctx, s)
}

func (h *SkillHandler) List(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")
	skills, err := h.svc.ListByProjectID(projectID)
	if validator.InternalServerError(ctx, err) {
		return
	}
	validator.Success(ctx, skills)
}

func (h *SkillHandler) Update(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	req, ok := validator.ParseAndValidate[UpdateSkillRequest](ctx)
	if !ok {
		return
	}

	if validator.InternalServerError(ctx, h.svc.Update(id, req.Name, req.Description, req.Config)) {
		return
	}
	validator.SuccessWithMessage(ctx, "updated")
}

func (h *SkillHandler) Delete(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	if validator.InternalServerError(ctx, h.svc.Delete(id)) {
		return
	}
	validator.SuccessWithMessage(ctx, "deleted")
}
