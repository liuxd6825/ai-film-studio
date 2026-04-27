package repository

import (
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

// CharacterRepository 角色数据访问层
type CharacterRepository struct {
	db *gorm.DB
}

// NewCharacterRepository 创建角色数据访问层实例
func NewCharacterRepository(db *gorm.DB) *CharacterRepository {
	return &CharacterRepository{db: db}
}

// Create 创建角色记录
func (r *CharacterRepository) Create(character *model.Character) error {
	return r.db.Create(character).Error
}

// GetByID 根据ID获取角色记录
func (r *CharacterRepository) GetByID(id string) (*model.Character, error) {
	var character model.Character
	err := r.db.Where("id = ?", id).First(&character).Error
	if err != nil {
		return nil, err
	}
	return &character, nil
}

// GetByProjectID 根据项目ID获取所有角色记录
func (r *CharacterRepository) GetByProjectID(projectID string) ([]model.Character, error) {
	var characters []model.Character
	err := r.db.Where("project_id = ?", projectID).Order("created_at DESC").Find(&characters).Error
	return characters, err
}

// Update 更新角色记录
func (r *CharacterRepository) Update(character *model.Character) error {
	return r.db.Save(character).Error
}

// Delete 根据ID删除角色记录
func (r *CharacterRepository) Delete(id string) error {
	return r.db.Delete(&model.Character{}, "id = ?", id).Error
}

// DeleteByProjectID 根据项目ID删除所有角色记录
func (r *CharacterRepository) DeleteByProjectID(projectID string) error {
	return r.db.Delete(&model.Character{}, "project_id = ?", projectID).Error
}
