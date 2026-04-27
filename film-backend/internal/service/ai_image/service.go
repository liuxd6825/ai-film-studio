package ai_image

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"open-film-service/internal/service/ai_jimeng"
	"time"

	"github.com/google/uuid"

	"open-film-service/internal/config"
)

var (
	ErrMissingAPIKey    = errors.New("API key is required")
	ErrInvalidProvider  = errors.New("invalid provider")
	ErrInvalidModel     = errors.New("invalid model")
	ErrGenerationFailed = errors.New("image generation failed")
)

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
	config        *config.Config
	jimengService *ai_jimeng.Service
}

func NewService(config *config.Config, jimengService *ai_jimeng.Service) *Service {
	return &Service{
		config:        config,
		jimengService: jimengService,
	}
}

func (s *Service) Generate(ctx context.Context, req GenerationRequest) (*GenerationResult, error) {
	startTime := time.Now()

	switch req.Model {
	case "openai", "azure":
		return s.generateWithOpenAI(ctx, req, startTime)
	case "stability":
		return s.generateWithStability(ctx, req, startTime)
	case "seedream_5.0_lite_web":
		return s.generateWithJiMengWeb(ctx, req, startTime)
	default:
		return nil, ErrInvalidProvider
	}
}

func (s *Service) generateWithJiMengWeb(ctx context.Context, req GenerationRequest, startTime time.Time) (*GenerationResult, error) {
	service := s.jimengService
	genReq := ai_jimeng.GenerateRequest{
		Prompt:      req.Prompt,
		Model:       req.Model,
		AspectRatio: req.AspectRatio,
		WorkType:    ai_jimeng.WorkType_ALL.String(),
		FilesUrl:    req.ReferenceImages,
		Resolution:  req.Size.String(),
		Workspace:   "11117754646028",
	}
	response, err := service.Generate(ctx, genReq)
	if err != nil {
		return nil, err
	}
	return &GenerationResult{
		ID:        response.ResultID,
		ResultId:  response.ResultID,
		ResultUrl: response.ResultUrl,
		Provider:  "jimeng",
	}, nil
}

func (s *Service) generateWithOpenAI(ctx context.Context, req GenerationRequest, startTime time.Time) (*GenerationResult, error) {
	url := fmt.Sprintf("%s/v1/images/generations", req.BaseURL)

	payload := map[string]interface{}{
		"prompt": req.Prompt,
		"model":  req.Model,
		"size":   string(req.Size),
		"n":      1,
	}

	if req.Quality != "" {
		payload["quality"] = req.Quality
	}

	if req.Model == "dall-e-3" {
		payload["style"] = "natural"
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", req.APIKey))

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResp struct {
			Error struct {
				Message string `json:"message"`
				Type    string `json:"type"`
			} `json:"error"`
		}
		json.NewDecoder(resp.Body).Decode(&errResp)
		return nil, fmt.Errorf("%w: %s", ErrGenerationFailed, errResp.Error.Message)
	}

	var result struct {
		Data []struct {
			URL     string `json:"url"`
			Base64  string `json:"b64_json"`
			Revised string `json:"revised_prompt"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(result.Data) == 0 {
		return nil, fmt.Errorf("%w: no image data returned", ErrGenerationFailed)
	}

	imageData := result.Data[0]
	imageURL := imageData.URL
	imageBase64 := imageData.Base64

	if imageBase64 != "" {
		imageURL = fmt.Sprintf("data:image/png;base64,%s", imageBase64)
	}

	aspectRatio := s.parseAspectRatio(string(req.Size))

	return &GenerationResult{
		ID:               uuid.New().String(),
		ImageURL:         imageURL,
		ImageData:        imageBase64,
		AspectRatio:      aspectRatio,
		ProcessingTimeMs: time.Since(startTime).Milliseconds(),
		Model:            req.Model,
		Provider:         "openai",
	}, nil
}

func (s *Service) generateWithStability(ctx context.Context, req GenerationRequest, startTime time.Time) (*GenerationResult, error) {
	url := fmt.Sprintf("%s/v1/generation/%s/text-to-image", req.BaseURL, req.Model)

	payload := map[string]interface{}{
		"text_prompts": []map[string]interface{}{
			{
				"text":   req.Prompt,
				"weight": 1.0,
			},
		},
		"cfg_scale": 7,
		"height":    1024,
		"width":     1024,
		"samples":   1,
		"steps":     30,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", req.APIKey))
	httpReq.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("%w: status %d", ErrGenerationFailed, resp.StatusCode)
	}

	var result struct {
		Artifacts []struct {
			Base64 string `json:"base64"`
			Type   int    `json:"type"`
		} `json:"artifacts"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(result.Artifacts) == 0 {
		return nil, fmt.Errorf("%w: no image data returned", ErrGenerationFailed)
	}

	imageBase64 := result.Artifacts[0].Base64
	imageURL := fmt.Sprintf("data:image/png;base64,%s", imageBase64)

	return &GenerationResult{
		ID:               uuid.New().String(),
		ImageURL:         imageURL,
		ImageData:        imageBase64,
		AspectRatio:      "1:1",
		ProcessingTimeMs: time.Since(startTime).Milliseconds(),
		Model:            req.Model,
		Provider:         "stability",
	}, nil
}

func (s *Service) parseAspectRatio(size string) string {
	switch size {
	case "256x256", "512x512", "1024x1024":
		return "1:1"
	case "1024x1792", "1792x1024":
		return "9:16"
	case "1024x768", "768x1024":
		return "4:3"
	default:
		return "1:1"
	}
}
