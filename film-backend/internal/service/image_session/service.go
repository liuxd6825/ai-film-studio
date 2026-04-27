package image_session

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"open-film-service/internal/model"
	"open-film-service/internal/repository"
)

var (
	ErrInvalidUUID = errors.New("invalid UUID format")
	ErrNotFound    = errors.New("image session not found")
)

type Service struct {
	repo *repository.ImageSessionRepository
}

func NewService(repo *repository.ImageSessionRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(orgID, projectID, name string) (*model.ImageSession, error) {
	imageSession := &model.ImageSession{
		ID:        uuid.New().String(),
		OrgID:     orgID,
		ProjectID: projectID,
		Name:      name,
		Status:    0,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.repo.Create(imageSession); err != nil {
		return nil, err
	}
	return imageSession, nil
}

func (s *Service) GetByID(id string) (*model.ImageSession, error) {
	imageSession, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}
	return imageSession, nil
}

func (s *Service) GetByProjectID(projectID string) ([]model.ImageSession, error) {
	return s.repo.GetByProjectID(projectID)
}

func (s *Service) UpdateStatus(id string, status int) (*model.ImageSession, error) {
	imageSession, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}

	imageSession.Status = status
	imageSession.UpdatedAt = time.Now()

	if err := s.repo.Update(imageSession); err != nil {
		return nil, err
	}
	return imageSession, nil
}

func (s *Service) Delete(id string) error {
	return s.repo.Delete(id)
}
