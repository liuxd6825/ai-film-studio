package ark

import (
	"context"
	"errors"
	"fmt"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/ai/aiservice/llm"
	"open-film-service/internal/ai/infrastructure/chatmodel"
	"open-film-service/internal/config"
	"strings"

	"github.com/cloudwego/eino/components/model"
	"github.com/cloudwego/eino/schema"
)

type LLMService struct {
	conf         *config.ProviderConfig
	chatModelMap map[string]model.ToolCallingChatModel
}

func NewLLMService(conf *config.ProviderConfig) (llm.ILLMService, error) {
	chatModelMap := map[string]model.ToolCallingChatModel{}
	for _, item := range conf.Models {
		chatModel, err := chatmodel.NewChatModel(context.Background(), item)
		if err != nil {
			return nil, err
		}
		key := fmt.Sprintf("%s/%s", conf.Id, item.Id)
		chatModelMap[key] = chatModel
	}

	return &LLMService{
		chatModelMap: chatModelMap,
		conf:         conf,
	}, nil
}

func (s *LLMService) newChatModel(modelKey string) (model.ToolCallingChatModel, error) {
	keys := strings.Split(modelKey, "/")
	modelConfig, ok := s.conf.Models[keys[1]]
	if ok {
		chatModel, err := chatmodel.NewChatModel(context.Background(), modelConfig)
		if err != nil {
			return nil, err
		}
		return chatModel, nil
	}
	return nil, errors.New("not found  model config " + modelKey)
}

func (s *LLMService) Generate(ctx context.Context, options aioptions.ChatRequest) (*aioptions.ChatResult, error) {
	var input []*schema.Message
	input = append(input, &schema.Message{
		Role:    schema.User,
		Content: options.Prompt,
	})
	chatModel, ok := s.chatModelMap[options.Model]
	if !ok {
		errors.New("not found  model config " + options.Model)
	}
	out, err := chatModel.Generate(ctx, input)
	if err != nil {
		return nil, err
	}
	lastIndex := strings.LastIndex(out.Content, `</think>`)
	if lastIndex > -1 {
		out.Content = out.Content[lastIndex+8:]
	}

	result := &aioptions.ChatResult{
		Content: out.Content,
	}
	return result, nil
}

func (s *LLMService) getChatModel(modelName string) (model.ToolCallingChatModel, bool) {
	chatModel, ok := s.chatModelMap[modelName]
	return chatModel, ok
}
func (s *LLMService) GetModels() []aioptions.Model {
	var list []aioptions.Model
	for _, item := range s.conf.Models {
		list = append(list, aioptions.Model{
			Id:    fmt.Sprintf("%s/%s", s.conf.Id, item.Id),
			Title: fmt.Sprintf("%s/%s", s.conf.Title, item.Title),
		})
	}
	return list

}

func (s *LLMService) GetProvider() aioptions.Provider {
	return aioptions.Provider{
		Id:    s.conf.Id,
		Title: s.conf.Title,
	}
}
