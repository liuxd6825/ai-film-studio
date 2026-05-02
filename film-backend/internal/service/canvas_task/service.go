package canvas_task

import (
	"context"
	"encoding/json"
	"errors"
	"open-film-service/internal/ai"
	"open-film-service/internal/ai/aioptions"
	"time"

	"open-film-service/internal/model"
	"open-film-service/internal/repository"

	"github.com/google/uuid"
	"golang.org/x/sync/singleflight"
	"gorm.io/gorm"
)

var (
	ErrTaskNotFound = errors.New("task not found")
)

type ImageResult struct {
	ResultID  string `json:"resultId"`
	TaskID    string `json:"taskId"`
	URL       string `json:"url"`
	Width     int    `json:"width"`
	Height    int    `json:"height"`
	CreatedAt int64  `json:"createdAt"`
}

type NodeTaskImagesResult struct {
	Images     []*ImageResult `json:"images"`
	TotalCount int64          `json:"totalCount"`
	Page       int            `json:"page"`
	PageSize   int            `json:"pageSize"`
	TotalPages int            `json:"totalPages"`
}

type Service struct {
	repo                 *repository.CanvasTaskRepository
	canvasTaskResultRepo *repository.CanvasTaskResultRepository
	sfGroup              singleflight.Group
	aiImageService       *ai.AiImageService
	aiVideoService       *ai.AiVideoService
}

func NewService(repo *repository.CanvasTaskRepository,
	canvasTaskResultRepo *repository.CanvasTaskResultRepository,
	aiImageService *ai.AiImageService,
	aiVideoService *ai.AiVideoService,
) *Service {
	return &Service{
		repo:                 repo,
		canvasTaskResultRepo: canvasTaskResultRepo,
		aiImageService:       aiImageService,
		aiVideoService:       aiVideoService,
	}
}

type CreateTaskRequest struct {
	TaskId    string
	CanvasID  string
	NodeID    string
	ProjectID string
	TaskType  string
	Provider  string
	Model     string
	Prompt    string
	ResultURL string
	ResultID  string
	Params    map[string]interface{}
	Workspace string
}

func (s *Service) CreateTask(req CreateTaskRequest) (*model.CanvasTask, error) {
	paramsJSON, err := json.Marshal(req.Params)
	if err != nil {
		paramsJSON = []byte("{}")
	}

	task := &model.CanvasTask{
		ID:        req.TaskId,
		CanvasID:  req.CanvasID,
		NodeID:    req.NodeID,
		ProjectID: req.ProjectID,
		TaskType:  req.TaskType,
		Provider:  req.Provider,
		Model:     req.Model,
		Prompt:    req.Prompt,
		ResultURL: req.ResultURL,
		ResultID:  req.ResultID,
		Params:    string(paramsJSON),
		Status:    model.TaskStatusPending,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Workspace: req.Workspace,
	}

	if err := s.repo.Create(task); err != nil {
		return nil, err
	}

	return task, nil
}

func (s *Service) GetTask(id string) (*model.CanvasTask, error) {
	task, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrTaskNotFound
	}
	return task, nil
}

func (s *Service) UpdateTaskStatus(id string, status int, resultURL string, resultData string, errorMessage string) error {
	return s.repo.UpdateStatus(id, status, resultURL, resultData, errorMessage)

}

func (s *Service) StartTask(id string) error {
	return s.repo.UpdateStatus(id, model.TaskStatusProcessing, "", "", "")
}

func (s *Service) CompleteTask(ctx context.Context, taskID string, results []*model.CanvasTaskResult) (*model.CanvasTask, error) {
	return s.completeTaskImpl(ctx, taskID, results)
}

func (s *Service) completeTaskImpl(ctx context.Context, taskID string, results []*model.CanvasTaskResult) (*model.CanvasTask, error) {
	task, err := s.repo.GetByID(taskID)
	if err != nil {
		return nil, ErrTaskNotFound
	}

	err = s.repo.DB().Transaction(func(tx *gorm.DB) error {
		if len(results) > 0 {
			for _, result := range results {
				result.TaskID = taskID
				result.NodeID = task.NodeID
				result.ResultID = task.ResultID
				result.ID = uuid.New().String()
			}
			if err := tx.Create(results).Error; err != nil {
				return err
			}
		}

		var resultURL string
		if len(results) > 0 {
			resultURL = results[0].URL
		}

		return tx.Model(&model.CanvasTask{}).Where("id = ?", task.ID).Updates(map[string]interface{}{
			"status":      model.TaskStatusCompleted,
			"result_url":  resultURL,
			"result_data": task.ResultData,
		}).Error
	})

	if err == nil {
		task.Status = model.TaskStatusCompleted
	}

	return task, err
}

func (s *Service) FailTask(id string, errorMessage string) error {
	_, err, _ := s.sfGroup.Do(id, func() (interface{}, error) {
		return nil, s.repo.UpdateStatus(id, model.TaskStatusFailed, "", "", errorMessage)
	})
	return err
}

func (s *Service) CancelTask(id string) error {
	_, err, _ := s.sfGroup.Do(id, func() (interface{}, error) {
		return nil, s.repo.UpdateStatus(id, model.TaskStatusCancelled, "", "", "")
	})
	return err
}

func (s *Service) ListByNodeID(nodeID string) ([]*model.CanvasTask, error) {
	return s.repo.ListByNodeID(nodeID)
}

func (s *Service) ListNodeTaskImages(ctx context.Context, nodeID string, page, pageSize int) (*NodeTaskImagesResult, error) {
	tasks, total, err := s.repo.ListByNodeIDPaginated(nodeID, page, pageSize)
	if err != nil {
		return nil, err
	}

	var images []*ImageResult
	for _, task := range tasks {
		results, err := s.canvasTaskResultRepo.GetByTaskID(task.ID)
		if err != nil {
			continue
		}
		for _, result := range results {
			images = append(images, &ImageResult{
				ResultID:  result.ID,
				TaskID:    task.ID,
				URL:       result.URL,
				Width:     result.Width,
				Height:    result.Height,
				CreatedAt: result.CreatedAt.Unix(),
			})
		}
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize != 0 {
		totalPages++
	}

	return &NodeTaskImagesResult{
		Images:     images,
		TotalCount: total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

func (s *Service) CountNodeTaskImages(nodeID string) (int64, error) {
	return s.canvasTaskResultRepo.CountByNodeID(nodeID)
}

func (s *Service) getAiTask(ctx context.Context, canvasTask *model.CanvasTask) (*aioptions.Task, error) {
	if canvasTask.TaskType == "image" {
		return s.aiImageService.GetTask(ctx, canvasTask.Model, canvasTask.ID)
	} else if canvasTask.TaskType == "video" {
		return s.aiVideoService.GetTask(ctx, canvasTask.Model, canvasTask.ID)
	}
	return nil, errors.New("invalid task type")
}

func (s *Service) PollTask(ctx context.Context, taskID string) (*model.CanvasTask, error) {
	task, err := s.repo.GetByID(taskID)
	if err != nil {
		return nil, err
	}

	if task.Status == aioptions.TaskStatusCompleted || task.Status == aioptions.TaskStatusFailed {
		return task, nil
	}

	aiTask, err := s.getAiTask(ctx, task)
	if err != nil {
		return nil, err
	}

	switch aiTask.Status {
	case aioptions.TaskStatusCompleted: //  "completed"
		var results []*model.CanvasTaskResult
		for _, content := range aiTask.Contents {
			results = append(results, &model.CanvasTaskResult{URL: content.VideoURL})
		}
		return s.CompleteTask(ctx, taskID, results)
	case aioptions.TaskStatusFailed:
		err = s.FailTask(taskID, aiTask.ErrorMsg)
		return task, err
	case aioptions.TaskStatusPending:
		return task, nil
	default:
		return task, errors.New("invalid task status")
	}
}
