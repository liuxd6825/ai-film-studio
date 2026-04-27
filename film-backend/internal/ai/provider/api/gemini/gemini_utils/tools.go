package gemini_utils

import "google.golang.org/genai"

func NewGeminiTools() []*genai.Tool {
	var tools []*genai.Tool
	tools = append(tools, &genai.Tool{
		GoogleSearch: &genai.GoogleSearch{},
	})
	return tools
}
