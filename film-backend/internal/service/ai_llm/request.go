package ai_llm

type GetVideoPromptRequest struct {
	CanvasID string `json:"canvasId,omitempty"  validate:"required"`
	NodeID   string `json:"nodeId,omitempty"  validate:"required"`
	Prompt   string `json:"prompt" validate:"required"`
	Model    string `json:"model" validate:"required"`
}

type GetVideoPromptResult struct {
	Prompt string `json:"prompt"`
}
