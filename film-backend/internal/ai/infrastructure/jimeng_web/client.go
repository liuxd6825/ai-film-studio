package jimeng_web

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/ai/aiservice/image"
	"time"
)

var (
	ErrMissingWorkspace = fmt.Errorf("workspace is required")
	ErrMissingPrompt    = fmt.Errorf("prompt is required")
	ErrInvalidResponse  = fmt.Errorf("invalid response from server")
	ErrGenerationFailed = fmt.Errorf("video generation failed")
)

const (
	ProviderId    = "jimeng"
	ProviderTitle = "即梦"
)

const (
	Seedance2FastVip = "jimeng-seedance2_fast_vip"
	Seedance2Fast    = "jimeng-seedance2_fast"
	Seedance2Vip     = "jimeng-seedance2_vip"
	Seedance2        = "jimeng-seedance2"
	Seedream5Lite    = "jimeng-seedream_5.0_lite"
	Seedream47       = "jimeng-seedream_4.7"
)

type JiMengClient struct {
	baseURL    string
	httpClient *http.Client
}

func NewJimengClient(baseURL string) *JiMengClient {
	return &JiMengClient{
		baseURL:    baseURL,
		httpClient: &http.Client{Timeout: 120 * time.Second},
	}
}

func newVideoService(baseURL string) image.IImageService {
	return NewJimengClient(baseURL)
}

func (s *JiMengClient) NewTask(ctx context.Context, opts aioptions.NewTaskOptions) (task *aioptions.Task, err error) {
	req := GenerateRequest{
		Prompt:    opts.Prompt,
		Model:     opts.Model,
		WorkType:  WorkType_ALL.String(),
		Workspace: opts.Workspace,
		TaskType:  opts.TaskType,
	}
	if opts.TaskType == aioptions.TaskTypeVideo {
		req.Seed = fmt.Sprintf("%d", opts.Video.Duration) + "s"
		req.AspectRatio = opts.Video.AspectRatio
		req.Resolution = opts.Video.Resolution.String()
		req.Model, err = s.GetVideoModel(opts.Model)
		if err != nil {
			return nil, err
		}
	} else if opts.TaskType == aioptions.TaskTypeImage {
		req.Seed = "0s"
		req.AspectRatio = opts.Image.AspectRatio
		req.Resolution = opts.Image.Resolution.String()
		req.Model, err = s.GetImageModel(opts.Model)
		if err != nil {
			return nil, err
		}
	} else if opts.TaskType == "" {
		return nil, errors.New("invalid task type")
	}

	// 引入的文件
	var fileUrls []string
	for _, i := range opts.RefItems {
		fileUrls = append(fileUrls, i.Url)
	}
	req.FilesUrl = fileUrls

	resp, err := s.generate(ctx, req)
	if err != nil {
		return nil, err
	}
	if resp.ErrorMessage != "" && resp.ErrorMessage != "生成中" {
		return nil, errors.New(resp.ErrorMessage)
	}
	task = aioptions.NewTask(resp.TaskID, opts.Model, aioptions.TaskStatusPending)
	return task, nil
}

func (s *JiMengClient) GetImageModels() []aioptions.Model {
	return []aioptions.Model{
		{
			Id:    "jimeng-seedream_5.0_lite",
			Title: "即梦网 5.0 Lite",
		},
		{
			Id:    "jimeng-seedream_4.7",
			Title: "即梦网 4.7",
		},
	}
}

func (s *JiMengClient) GetVideoModels() []aioptions.Model {
	return []aioptions.Model{
		{
			Id:    Seedance2FastVip,
			Title: "即梦网 SD2.0 Fast VIP",
		},
		{
			Id:    Seedance2Vip,
			Title: "即梦网 SD2.0 VIP",
		},
		{
			Id:    Seedance2Fast,
			Title: "即梦网 SD2.0 Fast",
		},
		{
			Id:    Seedance2,
			Title: "即梦网 SD2.0",
		},
	}
}

func (s *JiMengClient) GetModels() []aioptions.Model {
	videoModels := s.GetVideoModels()
	imageModels := s.GetImageModels()
	videoModels = append(videoModels, imageModels...)
	return videoModels
}

func (s *JiMengClient) GetProvider() aioptions.Provider {
	return aioptions.Provider{
		Id:    ProviderId,
		Title: ProviderTitle,
	}
}

func (s *JiMengClient) GetVideoModel(model string) (res string, err error) {
	switch model {
	case Seedance2FastVip:
		res = "Seedance 2.0 Fast VIP"
	case Seedance2Vip:
		res = "Seedance 2.0 VIP"
	case Seedance2Fast:
		res = "Seedance 2.0 Fast"
	case Seedance2:
		res = "Seedance 2.0"
	default:
		err = errors.New("invalid model " + model)
	}
	return res, err
}

func (s *JiMengClient) GetImageModel(model string) (res string, err error) {
	switch model {
	case Seedream47:
		res = "图片4.7"
	case Seedream5Lite:
		res = "图片5.0 Lite"
	default:
		err = errors.New("invalid model" + model)
	}
	return res, err
}

func (s *JiMengClient) generate(ctx context.Context, req GenerateRequest) (*GenerateResponse, error) {
	req.WorkType = "全能参考"

	if req.Workspace == "" {
		return nil, ErrMissingWorkspace
	}
	if req.Prompt == "" {
		return nil, ErrMissingPrompt
	}

	genType := "video"
	if req.TaskType == aioptions.TaskTypeImage {
		genType = "image"
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

func (s *JiMengClient) GetTask(ctx context.Context, model, taskID string) (*aioptions.Task, error) {
	res, err := s.getRequestResult(ctx, taskID)
	if err != nil {
		return nil, err
	}

	status := aioptions.TaskStatusPending
	switch res.Status {
	case "completed":
		status = aioptions.TaskStatusCompleted
	case "failed":
		status = aioptions.TaskStatusFailed
	case "generating":
		status = aioptions.TaskStatusProcessing
	case "pending":
		status = aioptions.TaskStatusPending
	default:
		return nil, errors.New("invalid task status: " + res.Status)
	}

	result := aioptions.NewTask(res.TaskID, res.Model, status)
	for _, item := range res.Results {
		for _, fileUrl := range item.FileUrls {
			result.AddContent(aioptions.TaskResultContent{
				TaskId:           taskID,
				Status:           item.Status,
				VideoURL:         fileUrl,
				CompletionTokens: 0,
				UpdatedAt:        item.UpdatedAt,
				CreatedAt:        item.CreatedAt,
			})
		}
	}

	return result, nil
}

func (s *JiMengClient) getRequest(ctx context.Context, taskID string) (*GetRequestResult, error) {
	if taskID == "" {
		return nil, fmt.Errorf("request_id is required")
	}

	url := fmt.Sprintf("%s/api/v1/request/%s", s.baseURL, taskID)
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

	var result GetRequestResult
	if err := json.Unmarshal(apiResp.Data, &result); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidResponse, err)
	}

	return &result, nil
}

func (s *JiMengClient) getRequestResult(ctx context.Context, taskID string) (*RequestResultResponse, error) {
	if taskID == "" {
		return nil, fmt.Errorf("request_id is required")
	}

	url := fmt.Sprintf("%s/api/v1/request/%s/result", s.baseURL, taskID)
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

	var result RequestResultResponse
	if err := json.Unmarshal(apiResp.Data, &result); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidResponse, err)
	}

	return &result, nil
}
