package aioptions

type ChatRequest struct {
	Model   string `json:"model"`
	Prompt  string `json:"prompt"`
	AgentId string `json:"agentId"`
}

type ChatResult struct {
	Content string `json:"content"`
}
