package chatmodel

import (
	"context"
	"open-film-service/internal/config"

	"github.com/cloudwego/eino-ext/components/model/openai"
	"github.com/cloudwego/eino/components/model"
)

func newOpenAIChatModel(ctx context.Context, conf *config.ModelConfig) (model.ToolCallingChatModel, error) {
	chatModel, err := openai.NewChatModel(ctx, &openai.ChatModelConfig{
		APIKey:      conf.APIKey,
		BaseURL:     conf.BaseURL,
		Temperature: conf.Temperature,
		TopP:        conf.TopP,
		Model:       conf.Id,
	})
	return chatModel, err
}
