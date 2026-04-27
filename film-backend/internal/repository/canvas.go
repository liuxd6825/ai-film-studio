package repository

import (
	"time"

	"gorm.io/gorm"
	"open-film-service/internal/model"
)

type CanvasRepository struct {
	db *gorm.DB
}

func NewCanvasRepository(db *gorm.DB) *CanvasRepository {
	return &CanvasRepository{db: db}
}

func (r *CanvasRepository) Create(canvas *model.Canvas) error {
	return r.db.Create(canvas).Error
}

func (r *CanvasRepository) GetByID(id string) (*model.Canvas, error) {
	var canvas model.Canvas
	err := r.db.Where("id = ?", id).First(&canvas).Error
	if err != nil {
		return nil, err
	}
	return &canvas, nil
}

func (r *CanvasRepository) ListByProjectID(projectID string, name string, startDate, endDate int64, offset, limit int) ([]*model.Canvas, int64, error) {
	var canvases []*model.Canvas
	var total int64

	query := r.db.Model(&model.Canvas{}).Where("project_id = ?", projectID)

	if name != "" {
		query = query.Where("name LIKE ?", "%"+name+"%")
	}
	if startDate > 0 {
		query = query.Where("created_at >= ?", startDate)
	}
	if endDate > 0 {
		query = query.Where("created_at <= ?", endDate)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if offset >= 0 && limit > 0 {
		query = query.Offset(offset).Limit(limit)
	}
	query = query.Order("updated_at DESC")

	if err := query.Find(&canvases).Error; err != nil {
		return nil, 0, err
	}

	return canvases, total, nil
}

func (r *CanvasRepository) Update(canvas *model.Canvas) error {
	return r.db.Save(canvas).Error
}

func (r *CanvasRepository) Delete(id string) error {
	return r.db.Delete(&model.Canvas{}, "id = ?", id).Error
}

func (r *CanvasRepository) DeleteByProjectID(projectID string) error {
	return r.db.Delete(&model.Canvas{}, "project_id = ?", projectID).Error
}

type ListCanvasesFilter struct {
	Name      string
	StartDate int64
	EndDate   int64
	Page      int
	PageSize  int
}

func (f *ListCanvasesFilter) Offset() int {
	if f.Page <= 0 {
		f.Page = 1
	}
	if f.PageSize <= 0 {
		f.PageSize = 20
	}
	return (f.Page - 1) * f.PageSize
}

func (f *ListCanvasesFilter) EndDateTime() time.Time {
	if f.EndDate > 0 {
		return time.Unix(f.EndDate, 0)
	}
	return time.Time{}
}
