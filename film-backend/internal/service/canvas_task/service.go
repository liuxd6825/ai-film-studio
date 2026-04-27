package canvas_task

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"open-film-service/internal/model"
	"open-film-service/internal/repository"
	"open-film-service/internal/service/ai_jimeng"

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
	jimengService        *ai_jimeng.Service
	sfGroup              singleflight.Group
}

func NewService(repo *repository.CanvasTaskRepository, canvasTaskResultRepo *repository.CanvasTaskResultRepository, jimengService *ai_jimeng.Service) *Service {
	return &Service{
		repo:                 repo,
		canvasTaskResultRepo: canvasTaskResultRepo,
		jimengService:        jimengService,
	}
}

type CreateTaskRequest struct {
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
}

func (s *Service) CreateTask(req CreateTaskRequest) (*model.CanvasTask, error) {
	paramsJSON, err := json.Marshal(req.Params)
	if err != nil {
		paramsJSON = []byte("{}")
	}

	task := &model.CanvasTask{
		ID:        uuid.New().String(),
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
		Progress:  0,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
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

func (s *Service) UpdateTaskStatus(id string, status int, resultURL string, resultData string, errorMessage string, progress int) error {
	return s.repo.UpdateStatus(id, status, resultURL, resultData, errorMessage, progress)

}

func (s *Service) StartTask(id string) error {
	return s.repo.UpdateStatus(id, model.TaskStatusProcessing, "", "", "", 0)
}

func (s *Service) CompleteTask(ctx context.Context, taskID string, results []*model.CanvasTaskResult) error {
	return s.completeTaskImpl(ctx, taskID, results)
}

func (s *Service) completeTaskImpl(ctx context.Context, taskID string, results []*model.CanvasTaskResult) error {
	task, err := s.repo.GetByID(taskID)
	if err != nil {
		return ErrTaskNotFound
	}

	return s.repo.DB().Transaction(func(tx *gorm.DB) error {
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
			"progress":    100,
		}).Error
	})
}

func (s *Service) FailTask(id string, errorMessage string) error {
	_, err, _ := s.sfGroup.Do(id, func() (interface{}, error) {
		return nil, s.repo.UpdateStatus(id, model.TaskStatusFailed, "", "", errorMessage, 0)
	})
	return err
}

func (s *Service) CancelTask(id string) error {
	_, err, _ := s.sfGroup.Do(id, func() (interface{}, error) {
		return nil, s.repo.UpdateStatus(id, model.TaskStatusCancelled, "", "", "", 0)
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

func (s *Service) PollJimengResult(taskID string, workspace string) error {
	return s.pollJimengResultImpl(taskID, workspace)
}

func (s *Service) pollJimengResultImpl(taskID string, workspace string) error {
	task, err := s.repo.GetByID(taskID)
	if err != nil {
		return err
	}

	if task.Provider != "jimeng" {
		return errors.New("only jimeng tasks support polling")
	}
	ctx := context.Background()
	result, err := s.jimengService.GetResult(ctx, workspace, task.ResultID)
	if err != nil {
		return err
	}

	if len(result.Tasks) == 0 {
		return errors.New("no tasks returned")
	}

	jimengTask := result.Tasks[0]
	switch jimengTask.Status {
	case "completed":
		var results []*model.CanvasTaskResult
		for _, url := range jimengTask.Results {
			results = append(results, &model.CanvasTaskResult{URL: url})
		}
		return s.CompleteTask(ctx, taskID, results)
	case "failed":
		return s.FailTask(taskID, jimengTask.Desc)
	case "processing", "pending", "generating":
		progress := 50
		if jimengTask.Status == "pending" {
			progress = 25
		}
		return s.repo.UpdateStatus(taskID, model.TaskStatusProcessing, "", "", "", progress)
	default:
		return nil
	}
}
