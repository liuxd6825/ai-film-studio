package repository

import (
	"context"
	"open-film-service/internal/model"

	"gorm.io/gorm"
)

// ShotRepository 镜头数据访问层
type ShotRepository struct {
	db *gorm.DB
}

// NewShotRepository 创建镜头数据访问层实例
func NewShotRepository(db *gorm.DB) *ShotRepository {
	return &ShotRepository{db: db}
}

// Create 创建镜头记录
func (r *ShotRepository) Create(shot *model.Shot) error {
	return r.db.Create(shot).Error
}

// GetByID 根据ID获取镜头记录
func (r *ShotRepository) GetByID(id string) (*model.Shot, error) {
	var shot model.Shot
	err := r.db.Where("id = ?", id).First(&shot).Error
	if err != nil {
		return nil, err
	}
	return &shot, nil
}

// GetByStoryPageID 根据故事页ID获取所有镜头记录
func (r *ShotRepository) GetByStoryPageID(storyPageID string) ([]model.Shot, error) {
	var shots []model.Shot
	err := r.db.Where("story_page_id = ?", storyPageID).Order("order_num ASC").Find(&shots).Error
	return shots, err
}

// GetByProjectID 根据项目ID获取所有镜头记录
func (r *ShotRepository) GetByProjectID(projectID string) ([]model.Shot, error) {
	var shots []model.Shot
	err := r.db.Where("project_id = ?", projectID).Order("created_at DESC").Find(&shots).Error
	return shots, err
}

// Update 更新镜头记录
func (r *ShotRepository) Update(shot *model.Shot) error {
	return r.db.Save(shot).Error
}

// Delete 根据ID删除镜头记录（级联删除关联关键帧）
func (r *ShotRepository) Delete(id string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Delete(&model.ShotKeyframe{}, "shot_id = ?", id).Error; err != nil {
			return err
		}
		return tx.Delete(&model.Shot{}, "id = ?", id).Error
	})
}

// DeleteBatch 批量删除镜头记录（级联删除关联关键帧）
func (r *ShotRepository) DeleteBatch(ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Delete(&model.ShotKeyframe{}, "shot_id IN ?", ids).Error; err != nil {
			return err
		}
		return tx.Delete(&model.Shot{}, "id IN ?", ids).Error
	})
}

// DeleteByStoryPageID 根据故事页ID删除所有镜头记录
func (r *ShotRepository) DeleteByStoryPageID(storyPageID string) error {
	return r.db.Delete(&model.Shot{}, "story_page_id = ?", storyPageID).Error
}

// DeleteByProjectID 根据项目ID删除所有镜头记录
func (r *ShotRepository) DeleteByProjectID(projectID string) error {
	return r.db.Delete(&model.Shot{}, "project_id = ?", projectID).Error
}

func (r *ShotRepository) GetMaxOrderNum(ctx context.Context, storyPageID string) (int, error) {
	var maxOrderNum int
	err := r.db.WithContext(ctx).Model(&model.Shot{}).
		Where("story_page_id = ?", storyPageID).
		Select("COALESCE(MAX(order_num), -1)").
		Scan(&maxOrderNum).Error
	return maxOrderNum, err
}

func (r *ShotRepository) CreateBatch(ctx context.Context, shots []model.Shot) error {
	if len(shots) == 0 {
		return nil
	}
	return r.db.WithContext(ctx).Create(&shots).Error
}
