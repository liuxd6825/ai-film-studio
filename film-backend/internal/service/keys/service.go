package keys

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
	repo *repository.APIKeyRepository
}

func NewService(repo *repository.APIKeyRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(projectID, name, keyHash string, expiresAt int64) (*model.APIKey, error) {
	projectIDParsed, err := parseUUID(projectID)
	if err != nil {
		return nil, ErrInvalidUUID
	}
	apiKey := &model.APIKey{
		ID:        uuid.New().String(),
		ProjectID: projectIDParsed.String(),
		Name:      name,
		KeyHash:   keyHash,
		Status:    model.APIKeyStatusActive,
		ExpiresAt: expiresAt,
	}
	if err := s.repo.Create(apiKey); err != nil {
		return nil, err
	}
	return apiKey, nil
}

func (s *Service) GetByID(id string) (*model.APIKey, error) {
	return s.repo.GetByID(id)
}

func (s *Service) ListByProjectID(projectID string) ([]model.APIKey, error) {
	return s.repo.ListByProjectID(projectID)
}

func (s *Service) Delete(id string) error {
	return s.repo.Delete(id)
}
