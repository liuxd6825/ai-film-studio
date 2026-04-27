package handler

import (
	"open-film-service/internal/model"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/shot_keyframe"

	"github.com/kataras/iris/v12"
)

type KeyframeHandler struct {
	svc *shot_keyframe.Service
}

func NewKeyframeHandler(svc *shot_keyframe.Service) *KeyframeHandler {
	return &KeyframeHandler{svc: svc}
}

type CreateKeyframeRequest struct {
	SessionID      string `json:"sessionId" validate:"maxLen=50"`
	ImageURL       string `json:"imageUrl" validate:"maxLen=500"`
	ThumbnailURL   string `json:"thumbnailUrl" validate:"maxLen=500"`
	Description    string `json:"description"`
	ImagePrompt    string `json:"imagePrompt"`
	ActionDesc     string `json:"actionDescription"`
	Dialogue       string `json:"dialogue"`
	OrderNum       int    `json:"orderNum"`
	CameraType     string `json:"cameraShotType" validate:"maxLen=50"`
	CameraSetting  string `json:"cameraSettings" validate:"maxLen=255"`
	CameraAngle    string `json:"cameraAngle" validate:"maxLen=50"`
	CameraMovement string `json:"cameraMovement" validate:"maxLen=50"`
	Duration       int    `json:"duration" validate:"maxLen=50"`
	SoundDesc      string `json:"soundEffects"`
}

type UpdateKeyframeRequest struct {
	SessionID      *string `json:"sessionId"`
	FrameNumber    *int    `json:"frameNumber"`
	ImageURL       *string `json:"imageUrl"`
	ThumbnailURL   *string `json:"thumbnailUrl"`
	Description    *string `json:"description"`
	ImagePrompt    *string `json:"imagePrompt"`
	ActionDesc     *string `json:"actionDescription"`
	Dialogue       *string `json:"dialogue"`
	SortOrder      *int    `json:"orderNum"`
	CameraType     *string `json:"cameraShotType"`
	CameraSetting  *string `json:"cameraSettings"`
	CameraAngle    *string `json:"cameraAngle"`
	CameraMovement *string `json:"cameraMovement"`
	Duration       *int    `json:"duration"`
	SoundDesc      *string `json:"soundEffects"`
}

func (h *KeyframeHandler) Create(ctx iris.Context) {
	shotID := ctx.Params().GetString("shot_id")
	projectID := ctx.Params().GetString("project_id")
	orgID := ctx.Params().GetString("org_id")

	req, ok := validator.ParseAndValidate[CreateKeyframeRequest](ctx)
	if !ok {
		return
	}

	result, err := h.svc.Create(orgID, projectID, shotID, req.SessionID, req.ImageURL, req.ThumbnailURL, req.ImagePrompt, req.ActionDesc, req.Dialogue, req.OrderNum, req.Duration)
	if validator.InternalServerError(ctx, err) {
		return
	}

	ctx.StatusCode(201)
	validator.Success(ctx, result)
}

func (h *KeyframeHandler) List(ctx iris.Context) {
	shotID := ctx.Params().GetString("shot_id")

	results, err := h.svc.GetByShotID(shotID)
	if validator.InternalServerError(ctx, err) {
		return
	}

	validator.Success(ctx, results)
}

func (h *KeyframeHandler) Get(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	result, err := h.svc.GetByID(id)
	if err != nil {
		validator.NotFoundError(ctx, "keyframe not found")
		return
	}
	validator.Success(ctx, result)
}

func (h *KeyframeHandler) Update(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	req, ok := validator.ParseAndValidate[UpdateKeyframeRequest](ctx)
	if !ok {
		return
	}

	result, err := h.svc.Update(id, req.SessionID, req.ImageURL, req.ThumbnailURL, req.Description, req.ImagePrompt, req.ActionDesc, req.Dialogue, req.FrameNumber, req.SortOrder, req.CameraType, req.CameraSetting, req.CameraAngle, req.CameraMovement, req.Duration, req.SoundDesc)
	if err != nil {
		validator.NotFoundError(ctx, "keyframe not found")
		return
	}
	validator.Success(ctx, result)
}

func (h *KeyframeHandler) Delete(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	if validator.InternalServerError(ctx, h.svc.Delete(id)) {
		return
	}
	validator.SuccessWithMessage(ctx, "deleted")
}

type AIGenerateKeyframesRequest struct {
	AgentId   string `json:"agentId"`
	ProjectId string `json:"projectId" validate:"required"`
	ShotId    string `json:"shotId" validate:"required"`
}

func (h *KeyframeHandler) AIGenerateFromShotScript(ctx iris.Context) {
	req, ok := validator.ParseAndValidate[AIGenerateKeyframesRequest](ctx)
	if !ok {
		return
	}

	shot, err := h.svc.GetShotByID(req.ShotId)
	if err != nil {
		validator.NotFoundError(ctx, "shot not found")
		return
	}

	shotPrompt := buildShotPrompt(shot)
	res, err := h.svc.AIGenerateFromShotScript(ctx, req.AgentId, req.ProjectId, req.ShotId, shotPrompt)
	if err != nil {
		validator.InternalServerError(ctx, err)
		return
	}

	validator.Success(ctx, res)
}

func buildShotPrompt(shot *model.Shot) string {
	var prompt string
	if shot.Content != "" {
		prompt += "画面描述:\n" + shot.Content + "\n"
	}
	if shot.ActionEmotion != "" {
		prompt += "---\n动作情绪:\n" + shot.ActionEmotion + "\n"
	}
	if shot.DialogueSound != "" {
		prompt += "---\n对白音效:\n" + shot.DialogueSound + "\n"
	}
	envInfo := ""
	if shot.SceneType != "" {
		envInfo += shot.SceneType
	}
	if shot.Weather != "" {
		if envInfo != "" {
			envInfo += ", " + shot.Weather
		} else {
			envInfo += shot.Weather
		}
	}
	if shot.TimeFrame != "" {
		if envInfo != "" {
			envInfo += ", " + shot.TimeFrame
		} else {
			envInfo += shot.TimeFrame
		}
	}
	if envInfo != "" {
		prompt += "---\n环境: " + envInfo + "\n"
	}
	if shot.Lighting != "" {
		prompt += "---\n光线: " + shot.Lighting + "\n"
	}
	cameraInfo := ""
	if shot.Framing != "" {
		cameraInfo += shot.Framing
	}
	if shot.CameraAngleH != "" {
		if cameraInfo != "" {
			cameraInfo += ", " + shot.CameraAngleH
		} else {
			cameraInfo += shot.CameraAngleH
		}
	}
	if shot.CameraAngleV != "" {
		if cameraInfo != "" {
			cameraInfo += ", " + shot.CameraAngleV
		} else {
			cameraInfo += shot.CameraAngleV
		}
	}
	if cameraInfo != "" {
		prompt += "---\n镜头: " + cameraInfo + "\n"
	}
	if shot.CameraMovement != "" {
		prompt += "---\n运镜: " + shot.CameraMovement + "\n"
	}
	return prompt
}

type BatchUpdateKeyframeRequest struct {
	Keyframes []shot_keyframe.BatchUpdateItem `json:"keyframes" validate:"required,dive"`
}

func (h *KeyframeHandler) BatchUpdate(ctx iris.Context) {
	req, ok := validator.ParseAndValidate[BatchUpdateKeyframeRequest](ctx)
	if !ok {
		return
	}

	if err := h.svc.BatchUpdate(req.Keyframes); err != nil {
		validator.InternalServerError(ctx, err)
		return
	}

	validator.SuccessWithMessage(ctx, "batch updated")
}
