package repository

import (
	"open-film-service/internal/model"

	"gorm.io/gorm"
)

// ShotKeyframeRepository 关键帧数据访问层
type ShotKeyframeRepository struct {
	db *gorm.DB
}

// NewShotKeyframeRepository 创建关键帧数据访问层实例
func NewShotKeyframeRepository(db *gorm.DB) *ShotKeyframeRepository {
	return &ShotKeyframeRepository{db: db}
}

// Create 创建关键帧记录
func (r *ShotKeyframeRepository) Create(keyframe *model.ShotKeyframe) error {
	return r.db.Create(keyframe).Error
}

// GetByID 根据ID获取关键帧记录
func (r *ShotKeyframeRepository) GetByID(id string) (*model.ShotKeyframe, error) {
	var keyframe model.ShotKeyframe
	err := r.db.Where("id = ?", id).First(&keyframe).Error
	if err != nil {
		return nil, err
	}
	return &keyframe, nil
}

// GetByShotID 根据镜头ID获取所有关键帧记录
func (r *ShotKeyframeRepository) GetByShotID(shotID string) ([]model.ShotKeyframe, error) {
	var keyframes []model.ShotKeyframe
	err := r.db.Where("shot_id = ?", shotID).Order("sort_order ASC, frame_num ASC").Find(&keyframes).Error
	return keyframes, err
}

// GetByProjectID 根据项目ID获取所有关键帧记录
func (r *ShotKeyframeRepository) GetByProjectID(projectID string) ([]model.ShotKeyframe, error) {
	var keyframes []model.ShotKeyframe
	err := r.db.Where("project_id = ?", projectID).Order("created_at DESC").Find(&keyframes).Error
	return keyframes, err
}

// Update 更新关键帧记录
func (r *ShotKeyframeRepository) Update(keyframe *model.ShotKeyframe) error {
	return r.db.Save(keyframe).Error
}

// Delete 根据ID删除关键帧记录
func (r *ShotKeyframeRepository) Delete(id string) error {
	return r.db.Delete(&model.ShotKeyframe{}, "id = ?", id).Error
}

// BatchUpdate 批量更新关键帧
func (r *ShotKeyframeRepository) BatchUpdate(keyframes []*model.ShotKeyframe) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, kf := range keyframes {
			if err := tx.Save(kf).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

// BatchCreate 批量创建关键帧
func (r *ShotKeyframeRepository) BatchCreate(keyframes []*model.ShotKeyframe) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.CreateInBatches(keyframes, 100).Error; err != nil {
			return err
		}
		return nil
	})
}

// DeleteByShotID 根据镜头ID删除所有关键帧记录
func (r *ShotKeyframeRepository) DeleteByShotID(shotID string) error {
	return r.db.Delete(&model.ShotKeyframe{}, "shot_id = ?", shotID).Error
}

// DeleteByProjectID 根据项目ID删除所有关键帧记录
func (r *ShotKeyframeRepository) DeleteByProjectID(projectID string) error {
	return r.db.Delete(&model.ShotKeyframe{}, "project_id = ?", projectID).Error
}

// GetMaxFrameNumByShotID 获取指定镜头下的最大帧号
func (r *ShotKeyframeRepository) GetMaxFrameNumByShotID(shotID string) (int, error) {
	var maxFrameNum int
	err := r.db.Model(&model.ShotKeyframe{}).
		Where("shot_id = ?", shotID).
		Select("COALESCE(MAX(frame_num), 0)").
		Scan(&maxFrameNum).Error
	return maxFrameNum, err
}
