package open_router_api

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"open-film-service/internal/ai/aioptions"
	"time"
)

const (
	ProviderId    = "openrouter"
	ProviderTitle = "OpenRouter"
)

var (
	ErrMissingAPIKey    = fmt.Errorf("api key is required")
	ErrMissingPrompt    = fmt.Errorf("prompt is required")
	ErrInvalidResponse  = fmt.Errorf("invalid response from server")
	ErrGenerationFailed = fmt.Errorf("video generation failed")
)

const (
	BaseURL = "https://openrouter.ai"
)

type Client struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
}

func NewClient(baseURL, apiKey string) *Client {
	return &Client{
		baseURL:    baseURL,
		apiKey:     apiKey,
		httpClient: &http.Client{Timeout: 120 * time.Second},
	}
}

func (s *Client) NewTask(ctx context.Context, opts aioptions.NewTaskOptions) (*aioptions.Task, error) {
	if s.apiKey == "" {
		return nil, ErrMissingAPIKey
	}
	if opts.Prompt == "" {
		return nil, ErrMissingPrompt
	}

	req := GenerateRequest{
		Model:  opts.Model,
		Prompt: opts.Prompt,
	}

	if opts.Video.AspectRatio != "" {
		req.AspectRatio = opts.Video.AspectRatio
	}
	if opts.Video.Resolution != "" {
		req.Resolution = opts.Video.Resolution.String()
	}
	if opts.Video.Duration > 0 {
		req.Duration = opts.Video.Duration
	}
	req.GenerateAudio = opts.Video.GenerateAudio

	resp, err := s.submitTask(ctx, req)
	if err != nil {
		return nil, err
	}

	task := aioptions.NewTask(resp.ID, opts.Model, aioptions.TaskStatusPending)
	return task, nil
}

func (s *Client) GetTask(ctx context.Context, model, taskID string) (*aioptions.Task, error) {
	if taskID == "" {
		return nil, fmt.Errorf("task_id is required")
	}

	status, err := s.pollTaskStatus(ctx, taskID)
	if err != nil {
		return nil, err
	}

	taskStatus := aioptions.TaskStatusPending
	switch status.Status {
	case "completed":
		taskStatus = aioptions.TaskStatusCompleted
	case "failed":
		taskStatus = aioptions.TaskStatusFailed
	}

	task := aioptions.NewTask(taskID, model, taskStatus)
	if status.Status == "completed" && len(status.UnsignedURLs) > 0 {
		task.AddContent(aioptions.TaskResultContent{
			TaskId:   taskID,
			Status:   status.Status,
			VideoURL: status.UnsignedURLs[0],
		})
	}
	if status.Error != "" {
		task.ErrorMsg = status.Error
	}

	return task, nil
}

func (s *Client) GetModels() []aioptions.Model {
	return []aioptions.Model{
		{Id: "openrouter/google/veo-3.1", Title: "OpenRouter/Google Veo 3.1"},
		{Id: "openrouter/alibaba/wan-2.7", Title: "OpenRouter/Alibaba Wan 2.7"},
	}
}

func (s *Client) GetProvider() aioptions.Provider {
	return aioptions.Provider{
		Id:    ProviderId,
		Title: ProviderTitle,
	}
}

func (s *Client) submitTask(ctx context.Context, req GenerateRequest) (*SubmitResponse, error) {
	jsonBody, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrGenerationFailed, err)
	}

	url := fmt.Sprintf("%s/api/v1/videos", s.baseURL)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrGenerationFailed, err)
	}

	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", s.apiKey))
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrGenerationFailed, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusAccepted && resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("%w: status %d", ErrGenerationFailed, resp.StatusCode)
	}

	var result SubmitResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidResponse, err)
	}

	return &result, nil
}

func (s *Client) pollTaskStatus(ctx context.Context, jobID string) (*PollResponse, error) {
	url := fmt.Sprintf("%s/api/v1/videos/%s", s.baseURL, jobID)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidResponse, err)
	}

	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", s.apiKey))

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidResponse, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("%w: status %d", ErrInvalidResponse, resp.StatusCode)
	}

	var result PollResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidResponse, err)
	}

	return &result, nil
}