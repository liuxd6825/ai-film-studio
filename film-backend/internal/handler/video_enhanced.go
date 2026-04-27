package handler

import (
	"time"

	"github.com/google/uuid"
	"github.com/kataras/iris/v12"
	"open-film-service/internal/pkg/validator"
)

type VideoEnhancedHandler struct {
	projectSvc interface {
		CreateVideoProject(projectID, name string) (map[string]interface{}, error)
		GetVideoProject(id string) (map[string]interface{}, error)
		UpdateVideoProject(id string, data map[string]interface{}) error
		DeleteVideoProject(id string) error
	}
	generationSvc interface {
		StartGeneration(projectID, nodeID, model string) (string, error)
		GetJobStatus(jobID string) (map[string]interface{}, error)
	}
}

func NewVideoEnhancedHandler(
	projectSvc interface {
		CreateVideoProject(projectID, name string) (map[string]interface{}, error)
		GetVideoProject(id string) (map[string]interface{}, error)
		UpdateVideoProject(id string, data map[string]interface{}) error
		DeleteVideoProject(id string) error
	},
	generationSvc interface {
		StartGeneration(projectID, nodeID, model string) (string, error)
		GetJobStatus(jobID string) (map[string]interface{}, error)
	},
) *VideoEnhancedHandler {
	return &VideoEnhancedHandler{
		projectSvc:    projectSvc,
		generationSvc: generationSvc,
	}
}

type CreateVideoProjectRequest struct {
	ProjectID string `json:"projectId" validate:"required"`
	Name      string `json:"name" validate:"required,maxLen=255"`
}

type UpdateVideoProjectRequest struct {
	Name string `json:"name" validate:"required,maxLen=255"`
}

type AddNodeRequest struct {
	Type     string                 `json:"type" validate:"required"`
	Position map[string]interface{} `json:"position"`
	Data     map[string]interface{} `json:"data"`
}

type UpdateNodeRequest struct {
	NodeID string                 `json:"nodeId" validate:"required"`
	Data   map[string]interface{} `json:"data"`
}

type DeleteNodeRequest struct {
	NodeID string `json:"nodeId" validate:"required"`
}

type GenerateRequest struct {
	NodeID string `json:"nodeId" validate:"required"`
	Model  string `json:"model" validate:"required"`
}

type ExportRequest struct {
	Format string `json:"format" validate:"required"`
}

func (h *VideoEnhancedHandler) CreateProject(ctx iris.Context) {
	req, ok := validator.ParseAndValidate[CreateVideoProjectRequest](ctx)
	if !ok {
		return
	}

	project, err := h.projectSvc.CreateVideoProject(req.ProjectID, req.Name)
	if validator.InternalServerError(ctx, err) {
		return
	}

	validator.Success(ctx, project)
}

func (h *VideoEnhancedHandler) GetProject(ctx iris.Context) {
	id := ctx.Params().GetString("id")

	project, err := h.projectSvc.GetVideoProject(id)
	if err != nil {
		validator.NotFoundError(ctx, "project not found")
		return
	}

	validator.Success(ctx, project)
}

func (h *VideoEnhancedHandler) UpdateProject(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	req, ok := validator.ParseAndValidate[UpdateVideoProjectRequest](ctx)
	if !ok {
		return
	}

	err := h.projectSvc.UpdateVideoProject(id, map[string]interface{}{"name": req.Name})
	if validator.InternalServerError(ctx, err) {
		return
	}

	validator.SuccessWithMessage(ctx, "project updated")
}

func (h *VideoEnhancedHandler) DeleteProject(ctx iris.Context) {
	id := ctx.Params().GetString("id")

	err := h.projectSvc.DeleteVideoProject(id)
	if validator.InternalServerError(ctx, err) {
		return
	}

	validator.SuccessWithMessage(ctx, "project deleted")
}

func (h *VideoEnhancedHandler) AddNode(ctx iris.Context) {
	projectID := ctx.Params().GetString("id")
	req, ok := validator.ParseAndValidate[AddNodeRequest](ctx)
	if !ok {
		return
	}

	node := map[string]interface{}{
		"id":       uuid.New().String(),
		"type":     req.Type,
		"position": req.Position,
		"data":     req.Data,
	}

	err := h.projectSvc.UpdateVideoProject(projectID, map[string]interface{}{
		"addNode": node,
	})
	if validator.InternalServerError(ctx, err) {
		return
	}

	validator.Success(ctx, node)
}

func (h *VideoEnhancedHandler) UpdateNode(ctx iris.Context) {
	projectID := ctx.Params().GetString("id")
	req, ok := validator.ParseAndValidate[UpdateNodeRequest](ctx)
	if !ok {
		return
	}

	err := h.projectSvc.UpdateVideoProject(projectID, map[string]interface{}{
		"updateNode": req,
	})
	if validator.InternalServerError(ctx, err) {
		return
	}

	validator.SuccessWithMessage(ctx, "node updated")
}

func (h *VideoEnhancedHandler) DeleteNode(ctx iris.Context) {
	projectID := ctx.Params().GetString("id")
	req, ok := validator.ParseAndValidate[DeleteNodeRequest](ctx)
	if !ok {
		return
	}

	err := h.projectSvc.UpdateVideoProject(projectID, map[string]interface{}{
		"deleteNode": req.NodeID,
	})
	if validator.InternalServerError(ctx, err) {
		return
	}

	validator.SuccessWithMessage(ctx, "node deleted")
}

func (h *VideoEnhancedHandler) Generate(ctx iris.Context) {
	projectID := ctx.Params().GetString("id")
	req, ok := validator.ParseAndValidate[GenerateRequest](ctx)
	if !ok {
		return
	}

	jobID, err := h.generationSvc.StartGeneration(projectID, req.NodeID, req.Model)
	if validator.InternalServerError(ctx, err) {
		return
	}

	validator.Success(ctx, iris.Map{"jobId": jobID})
}

func (h *VideoEnhancedHandler) GetJobStatus(ctx iris.Context) {
	jobID := ctx.Params().GetString("jobId")

	status, err := h.generationSvc.GetJobStatus(jobID)
	if err != nil {
		validator.NotFoundError(ctx, "job not found")
		return
	}

	validator.Success(ctx, status)
}

func (h *VideoEnhancedHandler) Export(ctx iris.Context) {
	projectID := ctx.Params().GetString("id")
	req, ok := validator.ParseAndValidate[ExportRequest](ctx)
	if !ok {
		return
	}

	project, err := h.projectSvc.GetVideoProject(projectID)
	if err != nil {
		validator.NotFoundError(ctx, "project not found")
		return
	}

	validator.Success(ctx, iris.Map{
		"exportUrl":   "export-" + time.Now().Format("20060102150405"),
		"projectName": project["name"],
		"format":      req.Format,
	})
}
