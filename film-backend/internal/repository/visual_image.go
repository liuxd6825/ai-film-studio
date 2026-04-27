package repository

import (
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

// VisualImageRepository 视觉图数据访问层
type VisualImageRepository struct {
	db *gorm.DB
}

// NewVisualImageRepository 创建视觉图数据访问层实例
func NewVisualImageRepository(db *gorm.DB) *VisualImageRepository {
	return &VisualImageRepository{db: db}
}

// Create 创建视觉图记录
func (r *VisualImageRepository) Create(visualImage *model.VisualImage) error {
	return r.db.Create(visualImage).Error
}

// GetByID 根据ID获取视觉图记录
func (r *VisualImageRepository) GetByID(id string) (*model.VisualImage, error) {
	var visualImage model.VisualImage
	err := r.db.Where("id = ?", id).First(&visualImage).Error
	if err != nil {
		return nil, err
	}
	return &visualImage, nil
}

// GetByProjectID 根据项目ID获取所有视觉图记录
func (r *VisualImageRepository) GetByProjectID(projectID string) ([]model.VisualImage, error) {
	var visualImages []model.VisualImage
	err := r.db.Where("project_id = ?", projectID).Order("created_at DESC").Find(&visualImages).Error
	return visualImages, err
}

// GetByVisualObjectID 根据视觉物ID获取关联的视觉图记录
func (r *VisualImageRepository) GetByVisualObjectID(visualObjectID string) ([]model.VisualImage, error) {
	var visualImages []model.VisualImage
	err := r.db.Where("visual_object_id = ?", visualObjectID).Order("created_at DESC").Find(&visualImages).Error
	return visualImages, err
}

// Update 更新视觉图记录
func (r *VisualImageRepository) Update(visualImage *model.VisualImage) error {
	return r.db.Save(visualImage).Error
}

// Delete 根据ID删除视觉图记录
func (r *VisualImageRepository) Delete(id string) error {
	return r.db.Delete(&model.VisualImage{}, "id = ?", id).Error
}

// DeleteByProjectID 根据项目ID删除所有视觉图记录
func (r *VisualImageRepository) DeleteByProjectID(projectID string) error {
	return r.db.Delete(&model.VisualImage{}, "project_id = ?", projectID).Error
}

// GetCoverByVisualObjectIDs 批量查询多个视觉物的封面图
func (r *VisualImageRepository) GetCoverByVisualObjectIDs(visualObjectIDs []string) (map[string]*model.VisualImage, error) {
	var images []model.VisualImage
	err := r.db.Where("visual_object_id IN ? AND is_cover = ?", visualObjectIDs, true).Find(&images).Error
	if err != nil {
		return nil, err
	}
	result := make(map[string]*model.VisualImage)
	for i := range images {
		if images[i].VisualObjectID != nil {
			result[*images[i].VisualObjectID] = &images[i]
		}
	}
	return result, nil
}

// ClearCoverFlags 清除某个视觉物下的所有封面标记
func (r *VisualImageRepository) ClearCoverFlags(visualObjectID string) error {
	return r.db.Model(&model.VisualImage{}).Where("visual_object_id = ?", visualObjectID).Update("is_cover", false).Error
}

// SetCover 设置某张图为封面（事务操作）
func (r *VisualImageRepository) SetCover(visualObjectID, imageID string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&model.VisualImage{}).Where("visual_object_id = ?", visualObjectID).Update("is_cover", false).Error; err != nil {
			return err
		}
		return tx.Model(&model.VisualImage{}).Where("id = ? AND visual_object_id = ?", imageID, visualObjectID).Update("is_cover", true).Error
	})
}
