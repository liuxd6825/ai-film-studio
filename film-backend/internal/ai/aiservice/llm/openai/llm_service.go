package openai

import (
	"context"
	"fmt"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/ai/aiservice/llm"
	"open-film-service/internal/ai/infrastructure/chatmodel"
	"open-film-service/internal/config"

	"github.com/cloudwego/eino/components/model"
)

type LLMService struct {
	providerId    string
	providerTitle string
	chatModel     model.ToolCallingChatModel
	conf          *config.ModelConfig
}

func NewLLMService(conf *config.ModelConfig) (llm.ILLMService, error) {
	chatModel, err := chatmodel.NewChatModel(context.Background(), conf)
	if err != nil {
		return nil, err
	}
	return &LLMService{
		providerId:    conf.Provider,
		providerTitle: conf.ProviderTitle,
		chatModel:     chatModel,
		conf:          conf,
	}, nil
}

func (s *LLMService) Chat(ctx context.Context, options aioptions.NewChatOptions) (string, error) {
	return "", nil
}

func (s *LLMService) GetModels() []aioptions.Model {
	return []aioptions.Model{
		{
			Id:    fmt.Sprintf("%s/%s", s.conf.Provider, s.conf.Id),
			Title: fmt.Sprintf("%s/%s", s.conf.ProviderTitle, s.conf.Title),
		},
	}
}

func (s *LLMService) GetProvider() aioptions.Provider {
	return aioptions.Provider{
		Id:    s.providerId,
		Title: s.providerTitle,
	}
}
