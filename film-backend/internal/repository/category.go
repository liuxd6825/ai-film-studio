package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"open-film-service/internal/model"
)

var ErrCategoryNotFound = errors.New("category not found")

type CategoryRepository struct {
	db *gorm.DB
}

func NewCategoryRepository(db *gorm.DB) *CategoryRepository {
	return &CategoryRepository{db: db}
}

func (r *CategoryRepository) Create(ctx context.Context, category *model.PromptCategory) error {
	if category.ID == uuid.Nil {
		category.ID = uuid.New()
	}
	return r.db.WithContext(ctx).Create(category).Error
}

func (r *CategoryRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.PromptCategory, error) {
	var category model.PromptCategory
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&category).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrCategoryNotFound
	}
	return &category, err
}

func (r *CategoryRepository) ListByProjectID(ctx context.Context, projectID uuid.UUID) ([]model.PromptCategory, error) {
	var categories []model.PromptCategory
	err := r.db.WithContext(ctx).Where("project_id = ?", projectID).Order("created_at DESC").Find(&categories).Error
	return categories, err
}

func (r *CategoryRepository) Update(ctx context.Context, category *model.PromptCategory) error {
	return r.db.WithContext(ctx).Save(category).Error
}

func (r *CategoryRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&model.PromptCategory{}).Error
}
