package repository

import (
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

// StoryPageRepository 故事页数据访问层
type StoryPageRepository struct {
	db *gorm.DB
}

// NewStoryPageRepository 创建故事页数据访问层实例
func NewStoryPageRepository(db *gorm.DB) *StoryPageRepository {
	return &StoryPageRepository{db: db}
}

// Create 创建故事页记录
func (r *StoryPageRepository) Create(storyPage *model.StoryPage) error {
	return r.db.Create(storyPage).Error
}

// GetByID 根据ID获取故事页记录
func (r *StoryPageRepository) GetByID(id string) (*model.StoryPage, error) {
	var storyPage model.StoryPage
	err := r.db.Where("id = ?", id).First(&storyPage).Error
	if err != nil {
		return nil, err
	}
	return &storyPage, nil
}

// GetByProjectID 根据项目ID获取所有故事页记录
func (r *StoryPageRepository) GetByProjectID(projectID string) ([]model.StoryPage, error) {
	var storyPages []model.StoryPage
	err := r.db.Where("project_id = ?", projectID).Order("sort_order ASC, created_at ASC").Find(&storyPages).Error
	return storyPages, err
}

// GetByBoardID 根据看板ID获取所有故事页记录
func (r *StoryPageRepository) GetByBoardID(boardID string) ([]model.StoryPage, error) {
	var storyPages []model.StoryPage
	err := r.db.Where("board_id = ?", boardID).Order("sort_order ASC, created_at ASC").Find(&storyPages).Error
	return storyPages, err
}

// Update 更新故事页记录
func (r *StoryPageRepository) Update(storyPage *model.StoryPage) error {
	return r.db.Save(storyPage).Error
}

// Delete 根据ID删除故事页记录
func (r *StoryPageRepository) Delete(id string) error {
	return r.db.Delete(&model.StoryPage{}, "id = ?", id).Error
}

// DeleteByProjectID 根据项目ID删除所有故事页记录
func (r *StoryPageRepository) DeleteByProjectID(projectID string) error {
	return r.db.Delete(&model.StoryPage{}, "project_id = ?", projectID).Error
}

// GetMaxSortOrderByBoardID 获取指定 Board 下最大的 sortOrder
func (r *StoryPageRepository) GetMaxSortOrderByBoardID(boardID string) (int, error) {
	var maxSortOrder int
	err := r.db.Model(&model.StoryPage{}).
		Where("board_id = ?", boardID).
		Select("COALESCE(MAX(sort_order), 0)").
		Scan(&maxSortOrder).Error
	return maxSortOrder, err
}
