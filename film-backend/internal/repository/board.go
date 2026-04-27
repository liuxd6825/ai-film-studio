package repository

import (
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

type BoardRepository struct {
	db *gorm.DB
}

func NewBoardRepository(db *gorm.DB) *BoardRepository {
	return &BoardRepository{db: db}
}

func (r *BoardRepository) Create(board *model.Board) error {
	return r.db.Create(board).Error
}

func (r *BoardRepository) GetByID(id string) (*model.Board, error) {
	var board model.Board
	err := r.db.First(&board, "id = ?", id).Error
	return &board, err
}

func (r *BoardRepository) ListByProjectID(projectID string) ([]model.Board, error) {
	var boards []model.Board
	err := r.db.Where("project_id = ?", projectID).Order("sort_order asc").Find(&boards).Error
	return boards, err
}

func (r *BoardRepository) Update(board *model.Board) error {
	return r.db.Save(board).Error
}

func (r *BoardRepository) Delete(id string) error {
	return r.db.Delete(&model.Board{}, "id = ?", id).Error
}
