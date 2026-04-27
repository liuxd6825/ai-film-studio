package gemini_utils

import (
	"context"
	"fmt"
	"open-film-service/internal/config"
	"open-film-service/internal/pkg/httputils"
	"os"

	"google.golang.org/genai"
)

// NewGeminiClient 初始化 Provider
// apiKey: Google Cloud/AI Studio API Key
// modelName: 指定模型版本，例如 "gemini-2.0-flash-exp" 或 "gemini-1.5-pro"
func NewGeminiClient(ctx context.Context, config config.ModelConfig) (*genai.Client, error) {
	if config.APIKey == "" {
		return nil, fmt.Errorf("Gemini API Key cannot be empty")
	}
	if config.Name == "" {
		config.Name = "gemini-2.0-flash-exp" // 2025年默认推荐模型
	}

	clientConfig := &genai.ClientConfig{
		APIKey:  config.APIKey,
		Backend: genai.BackendGeminiAPI,
	}
	if config.HttpProxy == "" {
		config.HttpProxy = os.Getenv("HTTP_PROXY")
	}
	if config.HttpProxy != "" {
		httpClient, err := httputils.NewHttpClient(config.HttpProxy)
		if err != nil {
			return nil, err
		}
		clientConfig.HTTPClient = httpClient
	}
	// 初始化 Client，建议在应用启动时初始化一次
	client, err := genai.NewClient(ctx, clientConfig)
	return client, err
}
