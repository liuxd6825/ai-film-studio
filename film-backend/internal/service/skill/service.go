package skill

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
	repo *repository.SkillRepository
}

func NewService(repo *repository.SkillRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(projectID, name, description, skillType, config string) (*model.Skill, error) {
	projectIDParsed, err := parseUUID(projectID)
	if err != nil {
		return nil, ErrInvalidUUID
	}
	skill := &model.Skill{
		ID:          uuid.New(),
		ProjectID:   projectIDParsed,
		Name:        name,
		Description: description,
		Type:        skillType,
		Config:      config,
	}
	if err := s.repo.Create(skill); err != nil {
		return nil, err
	}
	return skill, nil
}

func (s *Service) GetByID(id string) (*model.Skill, error) {
	return s.repo.GetByID(id)
}

func (s *Service) ListByProjectID(projectID string) ([]model.Skill, error) {
	return s.repo.ListByProjectID(projectID)
}

func (s *Service) Update(id, name, description, config string) error {
	skill, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if name != "" {
		skill.Name = name
	}
	if description != "" {
		skill.Description = description
	}
	if config != "" {
		skill.Config = config
	}
	return s.repo.Update(skill)
}

func (s *Service) Delete(id string) error {
	return s.repo.Delete(id)
}
