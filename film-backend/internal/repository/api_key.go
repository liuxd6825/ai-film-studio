package repository

import (
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

type APIKeyRepository struct {
	db *gorm.DB
}

func NewAPIKeyRepository(db *gorm.DB) *APIKeyRepository {
	return &APIKeyRepository{db: db}
}

func (r *APIKeyRepository) Create(apiKey *model.APIKey) error {
	return r.db.Create(apiKey).Error
}

func (r *APIKeyRepository) GetByID(id string) (*model.APIKey, error) {
	var apiKey model.APIKey
	err := r.db.Where("id = ?", id).First(&apiKey).Error
	if err != nil {
		return nil, err
	}
	return &apiKey, nil
}

func (r *APIKeyRepository) GetByKeyHash(keyHash string) (*model.APIKey, error) {
	var apiKey model.APIKey
	err := r.db.Where("key_hash = ?", keyHash).First(&apiKey).Error
	if err != nil {
		return nil, err
	}
	return &apiKey, nil
}

func (r *APIKeyRepository) ListByProjectID(projectID string) ([]model.APIKey, error) {
	var apiKeys []model.APIKey
	err := r.db.Where("project_id = ?", projectID).Find(&apiKeys).Error
	return apiKeys, err
}

func (r *APIKeyRepository) Update(apiKey *model.APIKey) error {
	return r.db.Save(apiKey).Error
}

func (r *APIKeyRepository) Delete(id string) error {
	return r.db.Delete(&model.APIKey{}, "id = ?", id).Error
}
