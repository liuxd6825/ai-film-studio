package aioptions

type ChatRequest struct {
	Model      string `json:"model"`
	Prompt     string `json:"prompt"`
	PromptType string `json:"promptType"`
}

type ChatResult struct {
	Content string `json:"content"`
}
