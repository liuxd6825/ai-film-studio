package handler

import (
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/shot"

	"github.com/kataras/iris/v12"
)

type ShotHandler struct {
	svc *shot.Service
}

func NewShotHandler(svc *shot.Service) *ShotHandler {
	return &ShotHandler{svc: svc}
}

type CreateShotRequest struct {
	OrderNum       int     `json:"orderNum"`
	SceneType      string  `json:"sceneType"`
	Content        string  `json:"content"`
	TimeFrame      string  `json:"timeFrame" validate:"maxLen=50"`
	Weather        string  `json:"weather" validate:"maxLen=50"`
	SessionID      *string `json:"sessionId"`
	Duration       int     `json:"duration"`
	CameraAngleH   string  `json:"cameraAngleH" validate:"maxLen=50"`
	CameraAngleV   string  `json:"cameraAngleV" validate:"maxLen=50"`
	NarrativePov   string  `json:"narrativePov" validate:"maxLen=50"`
	CameraMovement string  `json:"cameraMovement"`
	Framing        string  `json:"framing"`
	ActionEmotion  string  `json:"actionEmotion"`
	DialogueSound  string  `json:"dialogueSound"`
	Notes          string  `json:"notes"`
}

type UpdateShotRequest struct {
	SceneType      *string `json:"sceneType"`
	Content        *string `json:"content"`
	TimeFrame      *string `json:"timeFrame"`
	Lighting       *string `json:"lighting"`
	Weather        *string `json:"weather"`
	SessionID      *string `json:"sessionId"`
	Duration       *int    `json:"duration"`
	CameraAngleH   *string `json:"cameraAngleH"`
	CameraAngleV   *string `json:"cameraAngleV"`
	NarrativePov   *string `json:"narrativePov"`
	CameraMovement *string `json:"cameraMovement"`
	Framing        *string `json:"framing"`
	ActionEmotion  *string `json:"actionEmotion"`
	DialogueSound  *string `json:"dialogueSound"`
	Notes          *string `json:"notes"`
	State          *string `json:"state"`
}

func (h *ShotHandler) Create(ctx iris.Context) {
	storyPageID := ctx.Params().GetString("story_page_id")
	projectID := ctx.Params().GetString("project_id")
	orgID := ctx.Params().GetString("org_id")

	req, ok := validator.ParseAndValidate[CreateShotRequest](ctx)
	if !ok {
		return
	}

	result, err := h.svc.Create(orgID, projectID, storyPageID, req.OrderNum, req.SceneType, req.Content, req.TimeFrame, req.Weather, req.SessionID, req.Duration, req.CameraAngleH, req.CameraAngleV, req.NarrativePov, req.CameraMovement, req.Framing, req.ActionEmotion, req.DialogueSound, req.Notes)
	if validator.InternalServerError(ctx, err) {
		return
	}

	ctx.StatusCode(201)
	validator.Success(ctx, result)
}

func (h *ShotHandler) List(ctx iris.Context) {
	storyPageID := ctx.Params().GetString("story_page_id")

	results, err := h.svc.GetByStoryPageID(storyPageID)
	if validator.InternalServerError(ctx, err) {
		return
	}

	validator.Success(ctx, results)
}

func (h *ShotHandler) Get(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	result, err := h.svc.GetByID(id)
	if err != nil {
		validator.NotFoundError(ctx, "shot not found")
		return
	}
	validator.Success(ctx, result)
}

func (h *ShotHandler) Update(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	req, ok := validator.ParseAndValidate[UpdateShotRequest](ctx)
	if !ok {
		return
	}

	result, err := h.svc.Update(id, req.SceneType, req.Content, req.TimeFrame, req.Lighting, req.Weather, req.SessionID, req.Duration, req.CameraAngleH, req.CameraAngleV, req.NarrativePov, req.CameraMovement, req.Framing, req.ActionEmotion, req.DialogueSound, req.Notes, req.State)
	if err != nil {
		validator.NotFoundError(ctx, "shot not found")
		return
	}
	validator.Success(ctx, result)
}

func (h *ShotHandler) Delete(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	if validator.InternalServerError(ctx, h.svc.Delete(id)) {
		return
	}
	validator.SuccessWithMessage(ctx, "deleted")
}

type DeleteBatchRequest struct {
	IDs []string `json:"ids" validate:"required,min=1"`
}

func (h *ShotHandler) DeleteBatch(ctx iris.Context) {
	req, ok := validator.ParseAndValidate[DeleteBatchRequest](ctx)
	if !ok {
		return
	}

	if validator.InternalServerError(ctx, h.svc.DeleteBatch(req.IDs)) {
		return
	}
	validator.SuccessWithMessage(ctx, "batch deleted")
}

type GenerateFromScriptRequest struct {
	AgentId       string `json:"agentId" validate:""`
	ProjectId     string `json:"projectId" validate:"required"`
	ScriptSegment string `json:"scriptSegment" validate:"required"`
}

func (h *ShotHandler) GenerateFromScript(ctx iris.Context) {
	req, ok := validator.ParseAndValidate[GenerateFromScriptRequest](ctx)
	if !ok {
		return
	}

	res, err := h.svc.GenerateFromScript(ctx, req.AgentId, req.ProjectId, req.ScriptSegment)
	if err != nil {
		validator.InternalServerError(ctx, err)
		return
	}
	validator.Success(ctx, res)
}

func (h *ShotHandler) CreateBatch(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")
	storyPageID := ctx.Params().GetString("story_page_id")

	var req shot.CreateBatchRequest
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid request", "data": nil})
		return
	}

	if len(req.Shots) == 0 {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "shots cannot be empty", "data": nil})
		return
	}

	shots, err := h.svc.CreateBatch(ctx.Request().Context(), projectID, storyPageID, &req)
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": err.Error(), "data": nil})
		return
	}

	ctx.JSON(iris.Map{
		"code":    200,
		"message": "success",
		"data":    shot.CreateBatchResponse{Shots: shots},
	})
}
