package chatmodel

import (
	"context"
	"open-film-service/internal/config"

	"github.com/cloudwego/eino-ext/components/model/ollama"
	"github.com/cloudwego/eino/components/model"
)

func newOllamaChatModel(ctx context.Context, conf *config.ModelConfig) (model.ToolCallingChatModel, error) {
	chatModel, err := ollama.NewChatModel(ctx, &ollama.ChatModelConfig{
		BaseURL: conf.BaseURL,
		Model:   conf.Name,
	})
	return chatModel, err
}
