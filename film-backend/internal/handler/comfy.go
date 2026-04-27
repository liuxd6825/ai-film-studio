package handler

import (
	"github.com/kataras/iris/v12"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/comfy"
)

type ComfyHandler struct {
	svc *comfy.Service
}

func NewComfyHandler(svc *comfy.Service) *ComfyHandler {
	return &ComfyHandler{svc: svc}
}

type CreateWorkflowRequest struct {
	Name         string `json:"name" validate:"required,maxLen=255"`
	Description  string `json:"description"`
	WorkflowJSON string `json:"workflow_json"`
	InputSchema  string `json:"input_schema"`
	OutputSchema string `json:"output_schema"`
}

type UpdateWorkflowRequest struct {
	Name         string `json:"name" validate:"required,maxLen=255"`
	Description  string `json:"description"`
	WorkflowJSON string `json:"workflow_json"`
}

type ExecuteWorkflowRequest struct {
	Inputs map[string]interface{} `json:"inputs"`
}

func (h *ComfyHandler) Create(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")
	req, ok := validator.ParseAndValidate[CreateWorkflowRequest](ctx)
	if !ok {
		return
	}

	wf, err := h.svc.Create(projectID, req.Name, req.Description, req.WorkflowJSON, req.InputSchema, req.OutputSchema)
	if validator.InternalServerError(ctx, err) {
		return
	}

	ctx.StatusCode(201)
	validator.Success(ctx, wf)
}

func (h *ComfyHandler) List(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")
	workflows, err := h.svc.ListByProjectID(projectID)
	if validator.InternalServerError(ctx, err) {
		return
	}
	validator.Success(ctx, workflows)
}

func (h *ComfyHandler) Get(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	wf, err := h.svc.GetByID(id)
	if err != nil {
		validator.NotFoundError(ctx, "not found")
		return
	}
	validator.Success(ctx, wf)
}

func (h *ComfyHandler) Update(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	req, ok := validator.ParseAndValidate[UpdateWorkflowRequest](ctx)
	if !ok {
		return
	}

	if validator.InternalServerError(ctx, h.svc.Update(id, req.Name, req.Description, req.WorkflowJSON)) {
		return
	}
	validator.SuccessWithMessage(ctx, "updated")
}

func (h *ComfyHandler) Delete(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	if validator.InternalServerError(ctx, h.svc.Delete(id)) {
		return
	}
	validator.SuccessWithMessage(ctx, "deleted")
}

func (h *ComfyHandler) Execute(ctx iris.Context) {
	workflowID := ctx.Params().GetString("id")
	req, ok := validator.ParseAndValidate[ExecuteWorkflowRequest](ctx)
	if !ok {
		return
	}

	validator.Success(ctx, iris.Map{
		"execution_id": "exec_" + workflowID,
		"workflow_id":  workflowID,
		"status":       "queued",
		"inputs":       req.Inputs,
	})
}

func (h *ComfyHandler) GetExecution(ctx iris.Context) {
	executionID := ctx.Params().GetString("id")

	validator.Success(ctx, iris.Map{
		"execution_id": executionID,
		"status":       "running",
		"progress":     0.5,
	})
}
