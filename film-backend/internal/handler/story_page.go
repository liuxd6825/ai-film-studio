package handler

import (
	"open-film-service/internal/dto"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/story_page"

	"github.com/kataras/iris/v12"
)

type StoryPageHandler struct {
	svc *story_page.Service
}

func NewStoryPageHandler(svc *story_page.Service) *StoryPageHandler {
	return &StoryPageHandler{svc: svc}
}

type CreateStoryPageRequest struct {
	Title     string `json:"title" validate:"required,maxLen=255"`
	Desc      string `json:"desc"`
	SortOrder int    `json:"sortOrder"`
	StoryTime string `json:"storyTime" validate:"maxLen=50"`
	Weather   string `json:"weather" validate:"maxLen=50"`
}

type UpdateStoryPageRequest struct {
	Title     string `json:"title" validate:"maxLen=255"`
	Desc      string `json:"desc"`
	SortOrder int    `json:"sortOrder"`
	Status    int    `json:"status"`
	StoryTime string `json:"storyTime" validate:"maxLen=50"`
	Weather   string `json:"weather" validate:"maxLen=50"`
}

func (h *StoryPageHandler) Create(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")
	orgID := ctx.Params().GetString("org_id")

	req, ok := validator.ParseAndValidate[CreateStoryPageRequest](ctx)
	if !ok {
		return
	}

	result, err := h.svc.Create(orgID, projectID, "", req.Title, req.Desc, req.StoryTime, req.Weather, req.SortOrder)
	if validator.InternalServerError(ctx, err) {
		return
	}

	ctx.StatusCode(201)
	validator.Success(ctx, result)
}

func (h *StoryPageHandler) List(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")

	results, err := h.svc.GetByProjectID(projectID)
	if validator.InternalServerError(ctx, err) {
		return
	}

	validator.Success(ctx, results)
}

func (h *StoryPageHandler) Get(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	result, err := h.svc.GetByID(id)
	if err != nil {
		validator.NotFoundError(ctx, "story page not found")
		return
	}
	validator.Success(ctx, result)
}

func (h *StoryPageHandler) Update(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	req, ok := validator.ParseAndValidate[UpdateStoryPageRequest](ctx)
	if !ok {
		return
	}

	result, err := h.svc.Update(id, req.Title, req.Desc, req.StoryTime, req.Weather, req.SortOrder, req.Status)
	if err != nil {
		validator.NotFoundError(ctx, "story page not found")
		return
	}
	validator.Success(ctx, result)
}

func (h *StoryPageHandler) Delete(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	if validator.InternalServerError(ctx, h.svc.Delete(id)) {
		return
	}
	validator.SuccessWithMessage(ctx, "deleted")
}

func (h *StoryPageHandler) Analyze(ctx iris.Context) {
	storyPageID := ctx.Params().GetString("id")

	req, ok := validator.ParseAndValidate[dto.AnalyzeRequest](ctx)
	if !ok {
		return
	}

	result, err := h.svc.AnalyzeContent(ctx, storyPageID, &req)
	if validator.InternalServerError(ctx, err) {
		return
	}

	validator.Success(ctx, result)
}
