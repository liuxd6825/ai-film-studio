package chatmodel

import (
	"context"
	"errors"
	"open-film-service/internal/config"

	"github.com/cloudwego/eino/components/model"
)

type DriverType string

const (
	DriverTypeOpenAI DriverType = "openai"
	DriverTypeArk               = "ark"
	DriverTypeGemini            = "gemini"
	DriverTypeOllama            = "ollama"
)

func (d DriverType) String() string {
	return string(d)
}

func NewChatModel(ctx context.Context, conf *config.ModelConfig) (model.ToolCallingChatModel, error) {
	switch conf.DriverType {
	case "openai":
		return newOpenAIChatModel(ctx, conf)
	case "ark":
		return newArkChatModel(ctx, conf)
	case "gemini":
		return newGeminiChatModel(ctx, conf)
	case "ollama":
		return newGeminiChatModel(ctx, conf)
	}
	return nil, errors.New("unknown model driver")
}
