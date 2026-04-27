package model

import (
	"context"
	"open-film-service/internal/config"

	"github.com/cloudwego/eino-ext/components/model/openai"
	"github.com/cloudwego/eino/components/model"
)

func NewOpenAIModel(ctx context.Context, modelConfig *config.ModelConfig) (model.ToolCallingChatModel, error) {
	cfg := &openai.ChatModelConfig{
		APIKey:      modelConfig.APIKey,
		BaseURL:     modelConfig.BaseURL,
		Model:       modelConfig.Id,
		Temperature: modelConfig.Temperature,
		MaxTokens:   modelConfig.MaxTokens,
		TopP:        modelConfig.TopP,
		APIVersion:  modelConfig.APIVersion,
	}

	aiModel, err := openai.NewChatModel(ctx, cfg)
	return aiModel, err
}
