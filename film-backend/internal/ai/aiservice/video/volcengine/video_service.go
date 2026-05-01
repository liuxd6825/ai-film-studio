package volcengine

import (
	"context"
	"errors"
	"fmt"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/ai/aiservice/video"

	"github.com/volcengine/volcengine-go-sdk/service/arkruntime"
	arkmodel "github.com/volcengine/volcengine-go-sdk/service/arkruntime/model"
	"github.com/volcengine/volcengine-go-sdk/volcengine"
)

type VideoService struct {
	apiKey  string
	baseUrl string
	client  *arkruntime.Client
}

const (
	ProviderId    = "volcengine"
	ProviderTitle = "火山引擎"
)

func NewVideoService(apiKey, baseUrl string) *VideoService {
	if baseUrl == "" {
		baseUrl = "https://ark.cn-beijing.volces.com/api/v3"
	}
	client := arkruntime.NewClientWithApiKey(
		apiKey,
		arkruntime.WithBaseUrl(baseUrl),
	)

	return &VideoService{
		apiKey:  apiKey,
		baseUrl: baseUrl,
		client:  client,
	}
}

func newVideoService(apiKey, baseUrl string) video.IVideoService {
	if baseUrl == "" {
		baseUrl = "https://ark.cn-beijing.volces.com/api/v3"
	}
	client := arkruntime.NewClientWithApiKey(
		apiKey,
		arkruntime.WithBaseUrl(baseUrl),
	)

	return &VideoService{
		apiKey:  apiKey,
		baseUrl: baseUrl,
		client:  client,
	}
}

func (s *VideoService) NewTask(ctx context.Context, opts aioptions.NewTaskOptions) (task *aioptions.Task, err error) {
	// Model ID
	modelID := opts.Model // "doubao-seedance-2-0-260128"

	// Output video parameters
	generateAudio := true
	videoRatio := opts.VideoRatio // "16:9"
	if opts.VideoRatio != "" {
		videoRatio = opts.VideoRatio
	}
	videoDuration := int64(5)
	if opts.VideoDuration != 0 {
		videoDuration = int64(opts.VideoDuration)
	}
	showWatermark := true

	content := []*arkmodel.CreateContentGenerationContentItem{
		{
			Type: arkmodel.ContentGenerationContentItemTypeText,
			Text: volcengine.String(opts.Prompt),
		},
	}

	for _, i := range opts.RefItems {
		item := arkmodel.CreateContentGenerationContentItem{}
		switch i.Type {
		case aioptions.ReferenceImage:
			item.Type = arkmodel.ContentGenerationContentItemType("image_url")
			item.Role = volcengine.String("reference_image")
			item.ImageURL = &arkmodel.ImageURL{
				URL: i.Url,
			}
			break
		case aioptions.ReferenceAudio:
			item.Type = arkmodel.ContentGenerationContentItemType("audio_url")
			item.Role = volcengine.String("reference_audio")
			item.AudioURL = &arkmodel.AudioUrl{
				Url: i.Url,
			}
			break
		case aioptions.ReferenceVideo:
			item.Type = arkmodel.ContentGenerationContentItemType("video_url")
			item.Role = volcengine.String("reference_video")
			item.VideoURL = &arkmodel.VideoUrl{
				Url: i.Url,
			}
			break
		}
		content = append(content)
	}

	// 1. Create video generation task
	fmt.Println("----- create request -----")
	createReq := arkmodel.CreateContentGenerationTaskRequest{
		Model:         modelID,
		GenerateAudio: volcengine.Bool(generateAudio),
		Ratio:         volcengine.String(videoRatio),
		Duration:      volcengine.Int64(videoDuration),
		Watermark:     volcengine.Bool(showWatermark),
		Content:       content,
	}

	createResp, err := s.client.CreateContentGenerationTask(ctx, createReq)
	if err != nil {
		fmt.Printf("create content generation error: %v\n", err)
		return nil, err
	}

	taskID := createResp.ID
	fmt.Printf("Task Created with ID: %s\n", taskID)
	task = aioptions.NewTask(taskID, opts.Model, aioptions.TaskStatusPending)

	return task, nil
}

func (s *VideoService) getTaskStatus(status string) aioptions.TaskStatus {
	return aioptions.TaskStatusCompleted
}

func (s *VideoService) GetTask(ctx context.Context, model string, taskID string) (*aioptions.Task, error) {
	getReq := arkmodel.GetContentGenerationTaskRequest{ID: taskID}
	getResp, err := s.client.GetContentGenerationTask(ctx, getReq)
	if err != nil {
		fmt.Printf("get content generation task error: %v\n", err)
		return nil, err
	}
	status := s.getTaskStatus(getResp.Status)
	task := &aioptions.Task{
		TaskId: taskID,
		Model:  getResp.Model,
		Status: status,
	}

	switch status {
	case aioptions.TaskStatusCompleted:
		task.Contents = []aioptions.TaskResultContent{
			{
				TaskId:           getResp.ID,
				Status:           getResp.Status,
				VideoURL:         getResp.Content.VideoURL,
				CompletionTokens: getResp.Usage.CompletionTokens,
			},
		}
		return task, nil
	case aioptions.TaskStatusFailed:
		if getResp.Error != nil {
			msg := fmt.Sprintf("Error Code: %s, Message: %s\n", getResp.Error.Code, getResp.Error.Message)
			return task, errors.New(msg)
		}
	case aioptions.TaskStatusPending:
		return task, nil
	}
	return task, nil
}

func (s *VideoService) GetModels() []aioptions.Model {
	return []aioptions.Model{
		{
			Id:    "doubao-seedance-2-0-260128",
			Title: "seedance2.0",
		},
		{
			Id:    "doubao-seedance-2-0-fast-260128",
			Title: "seedance2.0 fast",
		},
	}
}

func (s *VideoService) GetProvider() aioptions.Provider {
	return aioptions.Provider{
		Id:    ProviderId,
		Title: ProviderTitle,
	}
}
