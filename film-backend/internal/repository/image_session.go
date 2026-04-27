package repository

import (
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

// ImageSessionRepository 生图会话数据访问层
type ImageSessionRepository struct {
	db *gorm.DB
}

// NewImageSessionRepository 创建生图会话数据访问层实例
func NewImageSessionRepository(db *gorm.DB) *ImageSessionRepository {
	return &ImageSessionRepository{db: db}
}

// Create 创建生图会话记录
func (r *ImageSessionRepository) Create(imageSession *model.ImageSession) error {
	return r.db.Create(imageSession).Error
}

// GetByID 根据ID获取生图会话记录
func (r *ImageSessionRepository) GetByID(id string) (*model.ImageSession, error) {
	var imageSession model.ImageSession
	err := r.db.Where("id = ?", id).First(&imageSession).Error
	if err != nil {
		return nil, err
	}
	return &imageSession, nil
}

// GetByProjectID 根据项目ID获取所有生图会话记录
func (r *ImageSessionRepository) GetByProjectID(projectID string) ([]model.ImageSession, error) {
	var imageSessions []model.ImageSession
	err := r.db.Where("project_id = ?", projectID).Order("created_at DESC").Find(&imageSessions).Error
	return imageSessions, err
}

// Update 更新生图会话记录
func (r *ImageSessionRepository) Update(imageSession *model.ImageSession) error {
	return r.db.Save(imageSession).Error
}

// Delete 根据ID删除生图会话记录
func (r *ImageSessionRepository) Delete(id string) error {
	return r.db.Delete(&model.ImageSession{}, "id = ?", id).Error
}

// DeleteByProjectID 根据项目ID删除所有生图会话记录
func (r *ImageSessionRepository) DeleteByProjectID(projectID string) error {
	return r.db.Delete(&model.ImageSession{}, "project_id = ?", projectID).Error
}
