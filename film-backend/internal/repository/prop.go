package repository

import (
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

// PropRepository 道具数据访问层
type PropRepository struct {
	db *gorm.DB
}

// NewPropRepository 创建道具数据访问层实例
func NewPropRepository(db *gorm.DB) *PropRepository {
	return &PropRepository{db: db}
}

// Create 创建道具记录
func (r *PropRepository) Create(prop *model.Prop) error {
	return r.db.Create(prop).Error
}

// GetByID 根据ID获取道具记录
func (r *PropRepository) GetByID(id string) (*model.Prop, error) {
	var prop model.Prop
	err := r.db.Where("id = ?", id).First(&prop).Error
	if err != nil {
		return nil, err
	}
	return &prop, nil
}

// GetByProjectID 根据项目ID获取所有道具记录
func (r *PropRepository) GetByProjectID(projectID string) ([]model.Prop, error) {
	var props []model.Prop
	err := r.db.Where("project_id = ?", projectID).Order("created_at DESC").Find(&props).Error
	return props, err
}

// Update 更新道具记录
func (r *PropRepository) Update(prop *model.Prop) error {
	return r.db.Save(prop).Error
}

// Delete 根据ID删除道具记录
func (r *PropRepository) Delete(id string) error {
	return r.db.Delete(&model.Prop{}, "id = ?", id).Error
}

// DeleteByProjectID 根据项目ID删除所有道具记录
func (r *PropRepository) DeleteByProjectID(projectID string) error {
	return r.db.Delete(&model.Prop{}, "project_id = ?", projectID).Error
}
