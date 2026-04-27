package repository

import (
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

type OrgRepository struct {
	db *gorm.DB
}

func NewOrgRepository(db *gorm.DB) *OrgRepository {
	return &OrgRepository{db: db}
}

func (r *OrgRepository) Create(org *model.Org) error {
	return r.db.Create(org).Error
}

func (r *OrgRepository) GetByID(id string) (*model.Org, error) {
	var org model.Org
	err := r.db.Where("id = ?", id).First(&org).Error
	if err != nil {
		return nil, err
	}
	return &org, nil
}

func (r *OrgRepository) GetByName(name string) (*model.Org, error) {
	var org model.Org
	err := r.db.Where("name = ?", name).First(&org).Error
	if err != nil {
		return nil, err
	}
	return &org, nil
}

func (r *OrgRepository) List() ([]model.Org, error) {
	var orgs []model.Org
	err := r.db.Find(&orgs).Error
	return orgs, err
}

func (r *OrgRepository) Update(org *model.Org) error {
	return r.db.Save(org).Error
}

func (r *OrgRepository) Delete(id string) error {
	return r.db.Delete(&model.Org{}, "id = ?", id).Error
}
