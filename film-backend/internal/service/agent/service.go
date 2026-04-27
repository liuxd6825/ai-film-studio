package agent

import (
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
	repo *repository.AgentRepository
}

func NewService(repo *repository.AgentRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(projectID, name, description, modelCfgID, skills, instructions string) (*model.Agent, error) {
	projectIDParsed, err := parseUUID(projectID)
	if err != nil {
		return nil, ErrInvalidUUID
	}
	modelCfgIDParsed, err := parseUUID(modelCfgID)
	if err != nil {
		return nil, ErrInvalidUUID
	}
	agent := &model.Agent{
		ID:           uuid.New().String(),
		ProjectID:    projectIDParsed.String(),
		Name:         name,
		Description:  description,
		ModelCfgID:   modelCfgIDParsed.String(),
		Skills:       skills,
		Instructions: instructions,
	}
	if err := s.repo.Create(agent); err != nil {
		return nil, err
	}
	return agent, nil
}

func (s *Service) GetByID(id string) (*model.Agent, error) {
	return s.repo.GetByID(id)
}

func (s *Service) ListByProjectID(projectID string) ([]model.Agent, error) {
	return s.repo.ListByProjectID(projectID)
}

func (s *Service) Update(id, name, description, skills, instructions string) error {
	agent, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if name != "" {
		agent.Name = name
	}
	if description != "" {
		agent.Description = description
	}
	if skills != "" {
		agent.Skills = skills
	}
	if instructions != "" {
		agent.Instructions = instructions
	}
	return s.repo.Update(agent)
}

func (s *Service) Delete(id string) error {
	return s.repo.Delete(id)
}
