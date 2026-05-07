package repository

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"open-film-service/internal/model"
)

var ErrPromptNotFound = errors.New("prompt not found")

type PromptRepository struct {
	db *gorm.DB
}

func NewPromptRepository(db *gorm.DB) *PromptRepository {
	return &PromptRepository{db: db}
}

func (r *PromptRepository) Create(ctx context.Context, prompt *model.Prompt) error {
	if prompt.ID == uuid.Nil {
		prompt.ID = uuid.New()
	}
	return r.db.WithContext(ctx).Create(prompt).Error
}

func (r *PromptRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Prompt, error) {
	var prompt model.Prompt
	err := r.db.WithContext(ctx).Where("id = ? AND is_latest = ?", id, true).First(&prompt).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrPromptNotFound
	}
	return &prompt, err
}

func (r *PromptRepository) GetByIDAny(ctx context.Context, id uuid.UUID) (*model.Prompt, error) {
	var prompt model.Prompt
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&prompt).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.New("prompt not found by GetByIDAny")
	}
	return &prompt, err
}

func (r *PromptRepository) ListByProjectID(ctx context.Context, projectID uuid.UUID, tag string) ([]model.Prompt, error) {
	var prompts []model.Prompt
	query := r.db.WithContext(ctx).Where("project_id = ? AND is_latest = ? AND is_system = ?", projectID, true, false)
	if tag != "" {
		query = query.Where("tags LIKE ?", "%"+tag+"%")
	}
	err := query.Order("updated_at DESC").Find(&prompts).Error
	return prompts, err
}

func (r *PromptRepository) Update(ctx context.Context, prompt *model.Prompt) error {
	return r.db.WithContext(ctx).Save(prompt).Error
}

func (r *PromptRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("prompt_id = ?", id).Delete(&model.PromptVersion{}).Error; err != nil {
			return err
		}
		return tx.Where("id = ?", id).Delete(&model.Prompt{}).Error
	})
}

func (r *PromptRepository) CreateVersion(ctx context.Context, version *model.PromptVersion) error {
	if version.ID == uuid.Nil {
		version.ID = uuid.New()
	}
	return r.db.WithContext(ctx).Create(version).Error
}

func (r *PromptRepository) GetVersions(ctx context.Context, promptID uuid.UUID) ([]model.PromptVersion, error) {
	var versions []model.PromptVersion
	err := r.db.WithContext(ctx).Where("prompt_id = ?", promptID).Order("version DESC").Find(&versions).Error
	return versions, err
}

func (r *PromptRepository) GetVersion(ctx context.Context, promptID uuid.UUID, version int) (*model.PromptVersion, error) {
	var v model.PromptVersion
	err := r.db.WithContext(ctx).Where("prompt_id = ? AND version = ?", promptID, version).First(&v).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.New("version not found")
	}
	return &v, err
}

func ParseVariables(variablesJSON string) ([]model.PromptVariable, error) {
	if variablesJSON == "" {
		return []model.PromptVariable{}, nil
	}
	var vars []model.PromptVariable
	err := json.Unmarshal([]byte(variablesJSON), &vars)
	return vars, err
}

func (r *PromptRepository) ListByCategoryKey(ctx context.Context, projectID uuid.UUID, categoryKey string) ([]model.Prompt, error) {
	var prompts []model.Prompt
	query := r.db.WithContext(ctx).Where("project_id = ? AND category_key = ? AND is_latest = ? AND is_system = ?", projectID, categoryKey, true, false)
	err := query.Order("updated_at DESC").Find(&prompts).Error
	return prompts, err
}

func (r *PromptRepository) ListByProjectIDWithSystem(ctx context.Context, projectID uuid.UUID, tag string) ([]model.Prompt, error) {
	var prompts []model.Prompt
	query := r.db.WithContext(ctx).Where("project_id = ? AND is_latest = ?", projectID, true)
	if tag != "" {
		query = query.Where("tags LIKE ?", "%"+tag+"%")
	}
	err := query.Order("updated_at DESC").Find(&prompts).Error
	return prompts, err
}

func (r *PromptRepository) ListByCategoryKeyWithSystem(ctx context.Context, projectID uuid.UUID, categoryKey string) ([]model.Prompt, error) {
	var prompts []model.Prompt
	query := r.db.WithContext(ctx).Where("project_id = ? AND category_key = ? AND is_latest = ?", projectID, categoryKey, true)
	err := query.Order("updated_at DESC").Find(&prompts).Error
	return prompts, err
}
