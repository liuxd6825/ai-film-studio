package comfy

import (
	"bytes"
	"encoding/json"
	"net/http"
	"time"
)

type Client struct {
	baseURL string
	client  *http.Client
}

func NewClient(baseURL string) *Client {
	return &Client{
		baseURL: baseURL,
		client:  &http.Client{Timeout: 5 * time.Minute},
	}
}

type ExecuteRequest struct {
	WorkflowJSON string                 `json:"workflow"`
	Input        map[string]interface{} `json:"input,omitempty"`
}

type ExecuteResponse struct {
	PromptID string `json:"prompt_id"`
	Number   int    `json:"number"`
}

func (c *Client) ExecuteWorkflow(workflowJSON string, input map[string]interface{}) (*ExecuteResponse, error) {
	req := &ExecuteRequest{
		WorkflowJSON: workflowJSON,
		Input:        input,
	}

	body, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	resp, err := c.client.Post(c.baseURL+"/api/execute", "application/json", bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result ExecuteResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result, nil
}

type HistoryResponse struct {
	Status struct {
		Status      string `json:"status"`
		CompletedAt int64  `json:"completed_at"`
	} `json:"status"`
	Outputs map[string]interface{} `json:"outputs"`
}

func (c *Client) GetHistory(promptID string) (*HistoryResponse, error) {
	resp, err := c.client.Get(c.baseURL + "/api/history/" + promptID)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result HistoryResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result, nil
}
