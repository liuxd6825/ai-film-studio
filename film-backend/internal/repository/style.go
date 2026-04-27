package repository

import (
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

type StyleRepository struct {
	db *gorm.DB
}

func NewStyleRepository(db *gorm.DB) *StyleRepository {
	return &StyleRepository{db: db}
}

func (r *StyleRepository) Create(style *model.Style) error {
	return r.db.Create(style).Error
}

func (r *StyleRepository) GetByID(id string) (*model.Style, error) {
	var style model.Style
	err := r.db.Where("id = ?", id).First(&style).Error
	if err != nil {
		return nil, err
	}
	return &style, nil
}

func (r *StyleRepository) GetByName(name string) (*model.Style, error) {
	var style model.Style
	err := r.db.Where("name = ?", name).First(&style).Error
	if err != nil {
		return nil, err
	}
	return &style, nil
}

func (r *StyleRepository) List() ([]model.Style, error) {
	var styles []model.Style
	err := r.db.Order("sort_order ASC, created_at ASC").Find(&styles).Error
	return styles, err
}

func (r *StyleRepository) Update(style *model.Style) error {
	return r.db.Save(style).Error
}

func (r *StyleRepository) Delete(id string) error {
	return r.db.Delete(&model.Style{}, "id = ?", id).Error
}
