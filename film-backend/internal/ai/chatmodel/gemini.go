package chatmodel

import (
	"context"
	"errors"
	"fmt"
	"open-film-service/internal/config"
	"time"

	"github.com/cloudwego/eino-ext/components/model/gemini"
	"github.com/cloudwego/eino/components/model"
	"google.golang.org/genai"
)

func newGeminiChatModel(ctx context.Context, conf *config.ModelConfig) (model.ToolCallingChatModel, error) {
	timeout := getTimeout(conf.Timeout)
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey: conf.APIKey,
		HTTPOptions: genai.HTTPOptions{
			Timeout: &timeout,
		},
	})
	if err != nil {
		return nil, errors.New(fmt.Sprintf("NewClient of gemini failed, err=%v", err))
	}

	chatModel, err := gemini.NewChatModel(ctx, &gemini.Config{
		Client: client,
		Model:  conf.Name,
		ThinkingConfig: &genai.ThinkingConfig{
			IncludeThoughts: true,
			ThinkingBudget:  nil,
		},
	})
	if err != nil {
		return nil, errors.New(fmt.Sprintf("NewChatModel of gemini failed, err=%v", err))
	}
	return chatModel, nil
}

func getTimeout(val string) time.Duration {
	if val == "" {
		return time.Minute * 5
	}
	duration, err := time.ParseDuration(val)
	if err != nil {
		panic(errors.New(fmt.Sprintf("timeout %s 转换失败: %s ", val, err.Error())))
	}
	return duration
}
