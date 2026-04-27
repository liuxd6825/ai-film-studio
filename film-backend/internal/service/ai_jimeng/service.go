package ai_jimeng

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"open-film-service/internal/logging"
	"time"
)

var (
	ErrMissingWorkspace = fmt.Errorf("workspace is required")
	ErrMissingPrompt    = fmt.Errorf("prompt is required")
	ErrInvalidResponse  = fmt.Errorf("invalid response from server")
	ErrGenerationFailed = fmt.Errorf("video generation failed")
)

type Service struct {
	baseURL    string
	httpClient *http.Client
}

type Model string

const (
	ModelImageSeedream5Lite    = "图片5.0 Lite"
	ModelVideoSeedance2        = "Seedance 2.0"
	ModelVideoSeedance2VIP     = "Seedance 2.0 VIP"
	ModelVideoSeedance2Fast    = "Seedance 2.0 Fast"
	ModelVideoSeedance2FastVIP = "Seedance 2.0 Fast VIP"
)

func (w Model) String() string {
	return string(w)
}

type Resolution string

const (
	Resolution2K Resolution = "2K"
	Resolution4K Resolution = "4K"
)

func (w Resolution) String() string {
	return string(w)
}

type WorkType string

const (
	WorkType_ALL WorkType = "全能参考"
)

func (w WorkType) String() string {
	return string(w)
}

type GenerateRequest struct {
	Prompt      string   `json:"prompt"`
	Model       string   `json:"model"`
	AspectRatio string   `json:"aspect_ratio"`
	Seed        string   `json:"seed"`
	WorkType    string   `json:"work_type"`
	FilesUrl    []string `json:"files_url"`
	Resolution  string   `json:"resolution"` // 分辨率
	Workspace   string   `json:"workspace"`  // 工作区
}

type GenerateResponse struct {
	ResultID  string `json:"result_id"`
	ResultUrl string `json:"result_url"`
	Result    string `json:"result"`
}

type VideoResultTask struct {
	ID        string   `json:"id"`
	Type      string   `json:"type"`
	Status    string   `json:"status"`
	Desc      string   `json:"desc"`
	CreatedAt string   `json:"created_at"`
	UpdatedAt string   `json:"updated_at"`
	Results   []string `json:"results"`
}

type VideoResultResponse struct {
	RequestID string            `json:"request_id"`
	Tasks     []VideoResultTask `json:"tasks"`
}

type apiResponse struct {
	Code    int             `json:"code"`
	Message string          `json:"message"`
	Success bool            `json:"success"`
	Data    json.RawMessage `json:"data"`
}

func NewService(baseURL string) *Service {
	return &Service{
		baseURL:    baseURL,
		httpClient: &http.Client{Timeout: 120 * time.Second},
	}
}

func (s *Service) Generate(ctx context.Context, req GenerateRequest) (resp *GenerateResponse, err error) {
	req.WorkType = "全能参考"
	genType := "video"
	switch req.Model {
	case "seedance_2.0_fast_web_vip":
		req.Model = "Seedance 2.0 Fast VIP"
	case "seedance_2.0_web_vip":
		req.Model = "Seedance 2.0 VIP"
	case "seedance_2.0_fast_web":
		req.Model = "Seedance 2.0 Fast"
	case "seedance_2.0_web":
		req.Model = "Seedance 2.0"
	case "seedream_5.0_lite_web":
		genType = "image"
		req.Model = "图片5.0 Lite"
		if req.Resolution == "1K" {
			req.Resolution = "2K"
		} else if req.Resolution == "8K" {
			req.Resolution = "4K"
		}
	default:
		err = errors.New("invalid model")
	}

	if err != nil {
		logging.Error(err)
	}
	return s.generate(ctx, genType, req)

}

func (s *Service) generate(ctx context.Context, genType string, req GenerateRequest) (*GenerateResponse, error) {
	if req.Workspace == "" {
		return nil, ErrMissingWorkspace
	}
	if req.Prompt == "" {
		return nil, ErrMissingPrompt
	}

	jsonBody, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrGenerationFailed, err)
	}

	url := fmt.Sprintf("%s/api/v1/%s/generate", s.baseURL, genType)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrGenerationFailed, err)
	}

	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrGenerationFailed, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("%w: status %d", ErrGenerationFailed, resp.StatusCode)
	}

	var apiResp apiResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidResponse, err)
	}

	if !apiResp.Success {
		return nil, fmt.Errorf("%w: %s", ErrGenerationFailed, apiResp.Message)
	}

	var result GenerateResponse
	if err := json.Unmarshal(apiResp.Data, &result); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidResponse, err)
	}

	return &result, nil
}

func (s *Service) GetResult(ctx context.Context, workspace string, requestID string) (*VideoResultResponse, error) {
	if workspace == "" {
		return nil, ErrMissingWorkspace
	}
	if requestID == "" {
		return nil, fmt.Errorf("request_id is required")
	}

	url := fmt.Sprintf("%s/api/v1/result/%s", s.baseURL, requestID)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidResponse, err)
	}

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidResponse, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("%w: status %d", ErrInvalidResponse, resp.StatusCode)
	}

	var apiResp apiResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidResponse, err)
	}

	if !apiResp.Success {
		return nil, fmt.Errorf("%w: %s", ErrGenerationFailed, apiResp.Message)
	}

	var result VideoResultResponse
	if err := json.Unmarshal(apiResp.Data, &result); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidResponse, err)
	}

	return &result, nil
}
