package media

import (
	"errors"
	"github.com/google/uuid"
	"open-film-service/internal/model"
	"open-film-service/internal/repository"
)

var ErrInvalidUUID = errors.New("invalid UUID format")

func parseUUID(s string) (uuid.UUID, error) {
	return uuid.Parse(s)
}

type Service struct {
	repo *repository.MediaTaskRepository
}

func NewService(repo *repository.MediaTaskRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(projectID string, mediaType model.MediaType, taskType, prompt, params string) (*model.MediaTask, error) {
	projectIDParsed, err := parseUUID(projectID)
	if err != nil {
		return nil, ErrInvalidUUID
	}
	task := &model.MediaTask{
		ID:        uuid.New(),
		ProjectID: projectIDParsed,
		MediaType: mediaType,
		Type:      taskType,
		Prompt:    prompt,
		Params:    params,
		Status:    0,
	}
	if err := s.repo.Create(task); err != nil {
		return nil, err
	}
	return task, nil
}

func (s *Service) GetByID(id string) (*model.MediaTask, error) {
	return s.repo.GetByID(id)
}

func (s *Service) ListByProjectID(projectID string, mediaType model.MediaType) ([]model.MediaTask, error) {
	return s.repo.ListByProjectID(projectID, mediaType)
}

func (s *Service) Update(id, prompt, params, resultURL string, status int) error {
	task, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if prompt != "" {
		task.Prompt = prompt
	}
	if params != "" {
		task.Params = params
	}
	if resultURL != "" {
		task.ResultURL = resultURL
	}
	if status >= 0 {
		task.Status = status
	}
	return s.repo.Update(task)
}

func (s *Service) Delete(id string) error {
	return s.repo.Delete(id)
}
