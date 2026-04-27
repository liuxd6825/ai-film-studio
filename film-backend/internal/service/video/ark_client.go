package video

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/volcengine/volcengine-go-sdk/service/arkruntime"
)

type ArkVideoRequest struct {
	Model   string                `json:"model"`
	Content []ArkVideoContentItem `json:"content"`
}

type ArkVideoContentItem struct {
	Type     string                `json:"type"`
	Text     string                `json:"text,omitempty"`
	ImageURL *ArkVideoImageURLItem `json:"image_url,omitempty"`
}

type ArkVideoImageURLItem struct {
	URL string `json:"url"`
}

type ArkVideoResponse struct {
	ID        string `json:"id"`
	CreatedAt int64  `json:"created_at"`
	Model     string `json:"model"`
	Object    string `json:"object"`
}

type ArkVideoClient struct {
	client *arkruntime.Client
	apiKey string
	model  string
}

func NewArkVideoClient(apiKey, model string) *ArkVideoClient {
	opts := []arkruntime.ConfigOption{
		arkruntime.WithBaseUrl("https://ark.cn-beijing.volces.com/api/v3"),
		arkruntime.WithRegion("cn-beijing"),
		arkruntime.WithTimeout(10 * time.Minute),
	}
	client := arkruntime.NewClientWithApiKey(apiKey, opts...)

	return &ArkVideoClient{
		client: client,
		apiKey: apiKey,
		model:  model,
	}
}

// Generate implements the video generation task creation
func (c *ArkVideoClient) Generate(ctx context.Context, prompt string, imageURL string) (*ArkVideoResponse, error) {
	req := &ArkVideoRequest{
		Model: c.model,
		Content: []ArkVideoContentItem{
			{
				Type: "text",
				Text: prompt,
			},
			{
				Type: "image_url",
				ImageURL: &ArkVideoImageURLItem{
					URL: imageURL,
				},
			},
		},
	}

	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	url := "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks"

	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)

	httpClient := &http.Client{Timeout: 10 * time.Minute}
	resp, err := httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ark API error: status %d", resp.StatusCode)
	}

	var result ArkVideoResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &result, nil
}
