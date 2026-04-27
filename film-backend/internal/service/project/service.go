package project

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
	repo *repository.ProjectRepository
}

func NewService(repo *repository.ProjectRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(orgID, name, description string, tags []string) (*model.Project, error) {
	orgIDParsed, err := parseUUID(orgID)
	if err != nil {
		return nil, ErrInvalidUUID
	}
	project := &model.Project{
		ID:          uuid.New(),
		OrgID:       orgIDParsed,
		Name:        name,
		Description: description,
	}
	project.SetTags(tags)
	if err := s.repo.Create(project); err != nil {
		return nil, err
	}
	return project, nil
}

func (s *Service) GetByID(id string) (*model.Project, error) {
	return s.repo.GetByID(id)
}

func (s *Service) ListByOrgID(orgID string) ([]model.Project, error) {
	return s.repo.GetByOrgID(orgID)
}

func (s *Service) Update(id, name, description string, tags []string) error {
	project, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if name != "" {
		project.Name = name
	}
	if description != "" {
		project.Description = description
	}
	if tags != nil {
		project.SetTags(tags)
	}
	return s.repo.Update(project)
}

func (s *Service) Delete(id string) error {
	return s.repo.Delete(id)
}
