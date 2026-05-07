package ai_llm

import (
	"context"
	_ "embed"
	"errors"
	"open-film-service/internal/ai"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/config"
	"strings"
)

var (
	ErrMissingAPIKey    = errors.New("API key is required")
	ErrInvalidProvider  = errors.New("invalid provider")
	ErrInvalidModel     = errors.New("invalid model")
	ErrGenerationFailed = errors.New("image generation failed")
)

//go:embed prompts/1.横版手动分段剧情提示词.md
var _horizontal_video_prompt string

//go:embed prompts/1.竖版手动分段剧情提示词.md
var _vertical_video_prompt string

//go:embed prompts/2.输出示例.md
var _videoPrompt string

//go:embed prompts/3.六宫格.md
var _six_grid_layout string

//go:embed prompts/4.男角色.md
var _man_character string

// PromptType 提示词类型
type PromptType struct {
	Id     string `json:"id,omitempty"`
	Title  string `json:"title,omitempty"`
	Prompt string `json:"prompt,omitempty"` // 提示词内容，会更新节点的提示词输入框
}

type ImageSize string

const (
	Size1K ImageSize = "1K"
	Size2K ImageSize = "2K"
	Size4K ImageSize = "4K"
	Size8K ImageSize = "8K"
)

func (s ImageSize) String() string {
	return string(s)
}

type GenerationRequest struct {
	Prompt          string    `json:"prompt"`
	Model           string    `json:"model"`
	Size            ImageSize `json:"size"`
	Quality         string    `json:"quality,omitempty"`
	N               int       `json:"n,omitempty"`
	Provider        string    `json:"provider"`
	APIKey          string    `json:"-"`
	BaseURL         string    `json:"-"`
	ReferenceImages []string  `json:"referenceImages,omitempty"`
	AspectRatio     string    `json:"aspectRatio,omitempty"`
}

type GenerationResult struct {
	ID               string `json:"id"`
	ImageURL         string `json:"imageUrl"`
	ImageData        string `json:"imageData,omitempty"`
	AspectRatio      string `json:"aspectRatio"`
	ProcessingTimeMs int64  `json:"processingTimeMs"`
	Model            string `json:"model"`
	Provider         string `json:"provider"`
	ResultId         string `json:"resultId"`
	ResultUrl        string `json:"resultUrl"`
}

type Service struct {
	config       *config.Config
	aiLLMService *ai.AiLLMService
	promptTypes  []PromptType
}

func NewService(config *config.Config, aiLLMService *ai.AiLLMService) *Service {
	return &Service{
		config:       config,
		aiLLMService: aiLLMService,
		promptTypes: []PromptType{
			{
				Id:    "chat",
				Title: "空",
			},
			{
				Id:    "horizontal_video_prompt",
				Title: "横版视频",
			},
			{
				Id:    "vertical_video_prompt",
				Title: "竖版视频",
			},
			{
				Id:    "six_grid_layout",
				Title: "六宫格",
			},
			{
				Id:     "man_character",
				Title:  "男角色",
				Prompt: `人设:\n年龄:\n气质风格:\n肤色:\n配饰:\n发型:`,
			},
			{
				Id:     "woman_character",
				Title:  "女角色",
				Prompt: `人设:\n年龄:\n气质风格:\n肤色:\n配饰:\n发型:`,
			},
		},
	}
}

func (s *Service) Generate(ctx context.Context, opts aioptions.ChatRequest) (*aioptions.ChatResult, error) {
	switch opts.PromptType {
	case "chat":
		return s.aiLLMService.Generate(ctx, opts)
	case "horizontal_video_prompt":
		return s.GetVideoPrompt(ctx, opts)
	case "vertical_video_prompt":
		return s.GetVideoPrompt(ctx, opts)
	case "six_grid_layout":
		return s.GetSixGridLayoutPrompt(ctx, opts)
	case "man_character":

	}
	return nil, errors.New("invalid prompt type " + opts.PromptType)
}

func (s *Service) GetSixGridLayoutPrompt(ctx context.Context, opts aioptions.ChatRequest) (*aioptions.ChatResult, error) {
	sb := strings.Builder{}
	sb.WriteString("根据以下要求生图片:\n```\n")
	sb.WriteString(opts.Prompt)
	sb.WriteString("\n```\n")
	sb.WriteString(_six_grid_layout)

	totalResult, err := s.aiLLMService.Generate(ctx, aioptions.ChatRequest{
		Model:  opts.Model,
		Prompt: sb.String(),
	})
	if err != nil {
		return nil, err
	}
	result := &aioptions.ChatResult{
		Content: totalResult.Content,
	}
	return result, nil
}

func (s *Service) GetModels(ctx context.Context) []aioptions.Model {
	return s.aiLLMService.GetModels()
}

func (s *Service) GetPromptTypes() []PromptType {
	return s.promptTypes
}

func (s *Service) GetVideoPrompt(ctx context.Context, opts aioptions.ChatRequest) (*aioptions.ChatResult, error) {
	sb := strings.Builder{}
	if opts.PromptType == "horizontal_video_prompt" {
		sb.WriteString(_horizontal_video_prompt)
	} else {
		sb.WriteString(_vertical_video_prompt)
	}

	sb.WriteString(opts.Prompt)
	totalResult, err := s.aiLLMService.Generate(ctx, aioptions.ChatRequest{
		Model:  opts.Model,
		Prompt: sb.String(),
	})
	if err != nil {
		return nil, err
	}

	sb.Reset()
	sb.WriteString(_videoPrompt)
	sb.WriteString("\n按**输出示例**格式对以下故事内容进行输出：\n")
	sb.WriteString(opts.Prompt)

	videoResult, err := s.aiLLMService.Generate(ctx, aioptions.ChatRequest{
		Model:  opts.Model,
		Prompt: sb.String(),
	})
	if err != nil {
		return nil, err
	}

	content := strings.Replace(totalResult.Content, "【整片情绪基调】", videoResult.Content+"【整片情绪基调】", 1)
	result := &aioptions.ChatResult{
		Content: content,
	}

	return result, nil
}
