package shot

import "open-film-service/internal/model"

type GenerateResult struct {
	ScriptSegment string      `json:"scriptSegment"`
	Summary       ShotSummary `json:"summary"`
	Storyboard    []ShotItem  `json:"storyboard"`
}

type ShotSummary struct {
	SceneNo       string `json:"sceneNo"`
	TotalShots    int    `json:"totalShots"`
	TotalDuration string `json:"totalDuration"`
	Description   string `json:"description"`
}

type ShotItem struct {
	ShotID         string `json:"shotId"`
	Duration       string `json:"duration"`
	SceneType      string `json:"sceneType"`
	TimeFrame      string `json:"timeFrame"`
	Weather        string `json:"weather"`
	Lighting       string `json:"lighting"`
	ShotType       string `json:"shotType"`
	CameraMovement string `json:"cameraMovement"`
	Framing        string `json:"framing"`
	Content        string `json:"content"`
	ActionEmotion  string `json:"actionEmotion"`
	DialogueSound  string `json:"dialogueSound"`
	Notes          string `json:"notes"`
}

type CreateBatchRequest struct {
	Shots []ShotItem `json:"shots"`
}

type CreateBatchResponse struct {
	Shots []model.Shot `json:"shots"`
}
