package dictionary

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"open-film-service/internal/model"
	"open-film-service/internal/repository"
)

var (
	ErrInvalidUUID = errors.New("invalid UUID format")
	ErrNotFound    = errors.New("dictionary not found")
)

type Service struct {
	repo *repository.DictionaryRepository
}

func NewService(repo *repository.DictionaryRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(orgID, category, key, value string, sortOrder int) (*model.Dictionary, error) {
	dictionary := &model.Dictionary{
		ID:        uuid.New().String(),
		OrgID:     orgID,
		Category:  category,
		Key:       key,
		Value:     value,
		SortOrder: sortOrder,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.repo.Create(dictionary); err != nil {
		return nil, err
	}
	return dictionary, nil
}

func (s *Service) GetByID(id string) (*model.Dictionary, error) {
	dictionary, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}
	return dictionary, nil
}

func (s *Service) GetByOrgID(orgID string) ([]model.Dictionary, error) {
	return s.repo.GetByOrgID(orgID)
}

func (s *Service) GetByCategory(orgID, category string) ([]model.Dictionary, error) {
	return s.repo.GetByCategory(orgID, category)
}

func (s *Service) Update(id, category, key, value string, sortOrder int) (*model.Dictionary, error) {
	dictionary, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}

	if category != "" {
		dictionary.Category = category
	}
	if key != "" {
		dictionary.Key = key
	}
	if value != "" {
		dictionary.Value = value
	}
	dictionary.SortOrder = sortOrder
	dictionary.UpdatedAt = time.Now()

	if err := s.repo.Update(dictionary); err != nil {
		return nil, err
	}
	return dictionary, nil
}

func (s *Service) Delete(id string) error {
	return s.repo.Delete(id)
}
