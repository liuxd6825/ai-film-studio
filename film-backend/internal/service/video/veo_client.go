package video

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type VeoClient struct {
	baseURL string
	apiKey  string
	client  *http.Client
}

func NewVeoClient(baseURL, apiKey string) *VeoClient {
	return &VeoClient{
		baseURL: baseURL,
		apiKey:  apiKey,
		client:  &http.Client{Timeout: 60 * time.Second},
	}
}

type GenerateRequest struct {
	Prompt         string `json:"prompt"`
	ImageURL       string `json:"imageUrl,omitempty"`
	VideoDuration  int    `json:"videoDurationSeconds,omitempty"`
	AspectRatio    string `json:"aspectRatio,omitempty"`
	NumberOfVideos int    `json:"numberOfVideos,omitempty"`
	Quality        string `json:"quality,omitempty"`
	Seed           int64  `json:"seed,omitempty"`
}

type GenerateResponse struct {
	OperationName string `json:"operationName"`
}

type OperationStatus struct {
	Name  string                 `json:"name"`
	Done  bool                   `json:"done"`
	Meta  map[string]interface{} `json:"metadata,omitempty"`
	Error *struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

func (c *VeoClient) Generate(ctx context.Context, req *GenerateRequest) (*GenerateResponse, error) {
	url := fmt.Sprintf("%s/v1beta/models/veo-2.0-generate:generate", c.baseURL)

	body, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("veo API error: status %d", resp.StatusCode)
	}

	var result GenerateResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result, nil
}

func (c *VeoClient) GetOperationStatus(ctx context.Context, operationName string) (*OperationStatus, error) {
	url := fmt.Sprintf("%s/v1beta/operations/%s", c.baseURL, operationName)

	httpReq, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("veo API error: status %d", resp.StatusCode)
	}

	var result OperationStatus
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result, nil
}
