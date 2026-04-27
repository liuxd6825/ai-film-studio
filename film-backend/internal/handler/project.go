package handler

import (
	"github.com/kataras/iris/v12"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/project"
)

type ProjectHandler struct {
	svc *project.Service
}

func NewProjectHandler(svc *project.Service) *ProjectHandler {
	return &ProjectHandler{svc: svc}
}

type CreateProjectRequest struct {
	Name        string   `json:"name" validate:"required,maxLen=255"`
	Description string   `json:"description"`
	Tags        []string `json:"tags"`
}

type UpdateProjectRequest struct {
	Name        string   `json:"name" validate:"required,maxLen=255"`
	Description string   `json:"description"`
	Tags        []string `json:"tags"`
}

func (h *ProjectHandler) Create(ctx iris.Context) {
	orgID := ctx.Params().GetString("org_id")
	req, ok := validator.ParseAndValidate[CreateProjectRequest](ctx)
	if !ok {
		return
	}

	proj, err := h.svc.Create(orgID, req.Name, req.Description, req.Tags)
	if validator.InternalServerError(ctx, err) {
		return
	}

	ctx.StatusCode(201)
	validator.Success(ctx, proj)
}

func (h *ProjectHandler) List(ctx iris.Context) {
	orgID := ctx.Params().GetString("org_id")
	projects, err := h.svc.ListByOrgID(orgID)
	if validator.InternalServerError(ctx, err) {
		return
	}

	projectResponses := make([]map[string]interface{}, len(projects))
	for i, p := range projects {
		projectResponses[i] = map[string]interface{}{
			"id":          p.ID.String(),
			"name":        p.Name,
			"description": p.Description,
			"tags":        p.GetTags(),
			"created_at":  p.CreatedAt,
			"updated_at":  p.UpdatedAt,
		}
	}
	validator.Success(ctx, projectResponses)
}

func (h *ProjectHandler) Get(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	proj, err := h.svc.GetByID(id)
	if err != nil {
		validator.NotFoundError(ctx, "not found")
		return
	}
	validator.Success(ctx, proj)
}

func (h *ProjectHandler) Update(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	req, ok := validator.ParseAndValidate[UpdateProjectRequest](ctx)
	if !ok {
		return
	}

	if validator.InternalServerError(ctx, h.svc.Update(id, req.Name, req.Description, req.Tags)) {
		return
	}
	validator.SuccessWithMessage(ctx, "updated")
}

func (h *ProjectHandler) Delete(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	if validator.InternalServerError(ctx, h.svc.Delete(id)) {
		return
	}
	validator.SuccessWithMessage(ctx, "deleted")
}
