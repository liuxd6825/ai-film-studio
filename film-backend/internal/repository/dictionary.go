package repository

import (
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

// DictionaryRepository 字典表数据访问层
type DictionaryRepository struct {
	db *gorm.DB
}

// NewDictionaryRepository 创建字典表数据访问层实例
func NewDictionaryRepository(db *gorm.DB) *DictionaryRepository {
	return &DictionaryRepository{db: db}
}

// Create 创建字典记录
func (r *DictionaryRepository) Create(dictionary *model.Dictionary) error {
	return r.db.Create(dictionary).Error
}

// GetByID 根据ID获取字典记录
func (r *DictionaryRepository) GetByID(id string) (*model.Dictionary, error) {
	var dictionary model.Dictionary
	err := r.db.Where("id = ?", id).First(&dictionary).Error
	if err != nil {
		return nil, err
	}
	return &dictionary, nil
}

// GetByOrgID 根据组织ID获取所有字典记录
func (r *DictionaryRepository) GetByOrgID(orgID string) ([]model.Dictionary, error) {
	var dictionaries []model.Dictionary
	err := r.db.Where("org_id = ?", orgID).Order("category ASC, sort_order ASC").Find(&dictionaries).Error
	return dictionaries, err
}

// GetByCategory 根据类别获取字典记录
func (r *DictionaryRepository) GetByCategory(orgID, category string) ([]model.Dictionary, error) {
	var dictionaries []model.Dictionary
	err := r.db.Where("org_id = ? AND category = ?", orgID, category).Order("sort_order ASC").Find(&dictionaries).Error
	return dictionaries, err
}

// Update 更新字典记录
func (r *DictionaryRepository) Update(dictionary *model.Dictionary) error {
	return r.db.Save(dictionary).Error
}

// Delete 根据ID删除字典记录
func (r *DictionaryRepository) Delete(id string) error {
	return r.db.Delete(&model.Dictionary{}, "id = ?", id).Error
}

// DeleteByCategory 根据类别删除字典记录
func (r *DictionaryRepository) DeleteByCategory(orgID, category string) error {
	return r.db.Delete(&model.Dictionary{}, "org_id = ? AND category = ?", orgID, category).Error
}
