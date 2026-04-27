package comfy

import (
	"context"
	"errors"
	"open-film-service/internal/model"
	"open-film-service/internal/repository"

	"github.com/google/uuid"
)

var ErrInvalidUUID = errors.New("invalid UUID format")

func parseUUID(s string) (uuid.UUID, error) {
	return uuid.Parse(s)
}

type Service struct {
	repo *repository.ComfyWorkflowRepository
}

func NewService(repo *repository.ComfyWorkflowRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(projectID, name, description, workflowJSON, inputSchema, outputSchema string) (*model.ComfyWorkflow, error) {
	projectIDParsed, err := parseUUID(projectID)
	if err != nil {
		return nil, ErrInvalidUUID
	}
	workflow := &model.ComfyWorkflow{
		ID:           uuid.New().String(),
		ProjectID:    projectIDParsed.String(),
		Name:         name,
		Description:  description,
		WorkflowJSON: workflowJSON,
		InputSchema:  inputSchema,
		OutputSchema: outputSchema,
	}
	if err := s.repo.Create(workflow); err != nil {
		return nil, err
	}
	return workflow, nil
}

func (s *Service) GetByID(id string) (*model.ComfyWorkflow, error) {
	return s.repo.GetByID(id)
}

func (s *Service) ListByProjectID(projectID string) ([]model.ComfyWorkflow, error) {
	return s.repo.ListByProjectID(projectID)
}

func (s *Service) Update(id, name, description, workflowJSON string) error {
	workflow, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if name != "" {
		workflow.Name = name
	}
	if description != "" {
		workflow.Description = description
	}
	if workflowJSON != "" {
		workflow.WorkflowJSON = workflowJSON
	}
	return s.repo.Update(workflow)
}

func (s *Service) Delete(id string) error {
	return s.repo.Delete(id)
}

type ComfyService struct {
	*Service
	executor *Executor
}

func NewComfyService(repo *repository.ComfyWorkflowRepository, executor *Executor) *ComfyService {
	return &ComfyService{
		Service:  NewService(repo),
		executor: executor,
	}
}

func (s *ComfyService) Execute(workflowJSON string, input map[string]interface{}) (*ExecutionResult, error) {
	return s.executor.Execute(context.Background(), workflowJSON, input)
}
