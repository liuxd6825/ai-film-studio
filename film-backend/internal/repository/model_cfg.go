package repository

import (
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

type ModelCfgRepository struct {
	db *gorm.DB
}

func NewModelCfgRepository(db *gorm.DB) *ModelCfgRepository {
	return &ModelCfgRepository{db: db}
}

func (r *ModelCfgRepository) Create(cfg *model.ModelCfg) error {
	return r.db.Create(cfg).Error
}

func (r *ModelCfgRepository) GetByID(id string) (*model.ModelCfg, error) {
	var cfg model.ModelCfg
	err := r.db.Where("id = ?", id).First(&cfg).Error
	if err != nil {
		return nil, err
	}
	return &cfg, nil
}

func (r *ModelCfgRepository) ListByProjectID(projectID string) ([]model.ModelCfg, error) {
	var cfgs []model.ModelCfg
	err := r.db.Where("project_id = ?", projectID).Find(&cfgs).Error
	return cfgs, err
}

func (r *ModelCfgRepository) Update(cfg *model.ModelCfg) error {
	return r.db.Save(cfg).Error
}

func (r *ModelCfgRepository) Delete(id string) error {
	return r.db.Delete(&model.ModelCfg{}, "id = ?", id).Error
}
