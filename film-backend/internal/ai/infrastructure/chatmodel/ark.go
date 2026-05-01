package chatmodel

import (
	"context"
	"open-film-service/internal/config"

	"github.com/cloudwego/eino-ext/components/model/ark"
	"github.com/cloudwego/eino/components/model"
)

func newArkChatModel(ctx context.Context, conf *config.ModelConfig) (model.ToolCallingChatModel, error) {
	chatModel, err := ark.NewChatModel(ctx, &ark.ChatModelConfig{
		APIKey:      conf.APIKey,
		Model:       conf.Id,
		TopP:        conf.TopP,
		Temperature: conf.Temperature,
		MaxTokens:   conf.MaxTokens,
	})
	return chatModel, err
}
