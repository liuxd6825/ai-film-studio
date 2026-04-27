package canvas

import (
	"errors"
	"log"
	"time"

	"open-film-service/internal/model"
	"open-film-service/internal/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrCanvasNotFound = errors.New("canvas not found")
var ErrInvalidUUID = errors.New("invalid UUID format")

type CanvasData struct {
	Name     string `json:"name"`
	Nodes    string `json:"nodes"`
	Edges    string `json:"edges"`
	Viewport string `json:"viewport"`
	History  string `json:"history"`
}

type ListFilter struct {
	Name      string
	StartDate int64
	EndDate   int64
	Page      int
	PageSize  int
}

type Service struct {
	repo *repository.CanvasRepository
}

func NewService(repo *repository.CanvasRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(projectID string, filter *ListFilter) ([]*model.Canvas, int64, error) {
	if filter == nil {
		filter = &ListFilter{Page: 1, PageSize: 20}
	}
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.PageSize <= 0 {
		filter.PageSize = 20
	}

	offset := (filter.Page - 1) * filter.PageSize
	endDate := filter.EndDate
	if endDate > 0 {
		endDate = filter.EndDate + 86400
	}

	return s.repo.ListByProjectID(projectID, filter.Name, filter.StartDate, endDate, offset, filter.PageSize)
}

func (s *Service) GetByID(id string) (*model.Canvas, error) {
	canvas, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCanvasNotFound
		}
		return nil, err
	}
	return canvas, nil
}

func (s *Service) Create(projectID, name, creatorID string) (*model.Canvas, error) {
	id := uuid.New().String()
	canvas := &model.Canvas{
		ID:        id,
		ProjectID: projectID,
		Name:      name,
		CreatorID: creatorID,
		Nodes:     "[]",
		Edges:     "[]",
		Viewport:  `{"x":0,"y":0,"zoom":1}`,
		History:   `{"past":[],"future":[]}`,
	}
	if err := s.repo.Create(canvas); err != nil {
		return nil, err
	}
	return canvas, nil
}

func (s *Service) Update(id, name string) error {
	canvas, err := s.repo.GetByID(id)
	if err != nil {
		return ErrCanvasNotFound
	}
	canvas.Name = name
	canvas.UpdatedAt = time.Now()
	return s.repo.Update(canvas)
}

func (s *Service) Save(id string, data *CanvasData) error {
	canvas, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrCanvasNotFound
		}
		log.Printf("canvas save: failed to get canvas %s: %v", id, err)
		return err
	}

	if data.Nodes != "" {
		canvas.Nodes = data.Nodes
	}
	if data.Edges != "" {
		canvas.Edges = data.Edges
	}
	if data.Viewport != "" {
		canvas.Viewport = data.Viewport
	}
	if data.History != "" {
		canvas.History = data.History
	}
	canvas.UpdatedAt = time.Now()

	if err := s.repo.Update(canvas); err != nil {
		log.Printf("canvas save: failed to update canvas %s: %v", id, err)
		return err
	}
	return nil
}

func (s *Service) Delete(id string) error {
	return s.repo.Delete(id)
}
