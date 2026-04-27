package models

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
	repo *repository.ModelCfgRepository
}

func NewService(repo *repository.ModelCfgRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(projectID, provider, modelName, encryptedKey, baseURL, settings string, priority int) (*model.ModelCfg, error) {
	projectIDParsed, err := parseUUID(projectID)
	if err != nil {
		return nil, ErrInvalidUUID
	}
	cfg := &model.ModelCfg{
		ID:           uuid.New(),
		ProjectID:    projectIDParsed,
		Provider:     provider,
		ModelName:    modelName,
		EncryptedKey: encryptedKey,
		BaseURL:      baseURL,
		Settings:     settings,
		Priority:     priority,
	}
	if err := s.repo.Create(cfg); err != nil {
		return nil, err
	}
	return cfg, nil
}

func (s *Service) GetByID(id string) (*model.ModelCfg, error) {
	return s.repo.GetByID(id)
}

func (s *Service) ListByProjectID(projectID string) ([]model.ModelCfg, error) {
	return s.repo.ListByProjectID(projectID)
}

func (s *Service) Update(id, provider, modelName, encryptedKey, baseURL, settings string, priority int) error {
	cfg, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if provider != "" {
		cfg.Provider = provider
	}
	if modelName != "" {
		cfg.ModelName = modelName
	}
	if encryptedKey != "" {
		cfg.EncryptedKey = encryptedKey
	}
	if baseURL != "" {
		cfg.BaseURL = baseURL
	}
	if settings != "" {
		cfg.Settings = settings
	}
	cfg.Priority = priority
	return s.repo.Update(cfg)
}

func (s *Service) Delete(id string) error {
	return s.repo.Delete(id)
}
