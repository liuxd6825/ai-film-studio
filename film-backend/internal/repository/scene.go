package repository

import (
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

// SceneRepository 场景数据访问层
type SceneRepository struct {
	db *gorm.DB
}

// NewSceneRepository 创建场景数据访问层实例
func NewSceneRepository(db *gorm.DB) *SceneRepository {
	return &SceneRepository{db: db}
}

// Create 创建场景记录
func (r *SceneRepository) Create(scene *model.Scene) error {
	return r.db.Create(scene).Error
}

// GetByID 根据ID获取场景记录
func (r *SceneRepository) GetByID(id string) (*model.Scene, error) {
	var scene model.Scene
	err := r.db.Where("id = ?", id).First(&scene).Error
	if err != nil {
		return nil, err
	}
	return &scene, nil
}

// GetByProjectID 根据项目ID获取所有场景记录
func (r *SceneRepository) GetByProjectID(projectID string) ([]model.Scene, error) {
	var scenes []model.Scene
	err := r.db.Where("project_id = ?", projectID).Order("created_at DESC").Find(&scenes).Error
	return scenes, err
}

// Update 更新场景记录
func (r *SceneRepository) Update(scene *model.Scene) error {
	return r.db.Save(scene).Error
}

// Delete 根据ID删除场景记录
func (r *SceneRepository) Delete(id string) error {
	return r.db.Delete(&model.Scene{}, "id = ?", id).Error
}

// DeleteByProjectID 根据项目ID删除所有场景记录
func (r *SceneRepository) DeleteByProjectID(projectID string) error {
	return r.db.Delete(&model.Scene{}, "project_id = ?", projectID).Error
}
