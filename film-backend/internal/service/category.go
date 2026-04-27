package service

import (
	"context"
	"errors"

	"github.com/google/uuid"

	"open-film-service/internal/model"
	"open-film-service/internal/repository"
)

var ErrCategoryNotFound = errors.New("category not found")

type CategoryService struct {
	repo *repository.CategoryRepository
}

func NewCategoryService(repo *repository.CategoryRepository) *CategoryService {
	return &CategoryService{repo: repo}
}

type CreateCategoryRequest struct {
	ProjectID uuid.UUID `json:"projectId"`
	Name      string    `json:"name"`
}

func (s *CategoryService) Create(ctx context.Context, req *CreateCategoryRequest) (*model.PromptCategory, error) {
	category := &model.PromptCategory{
		ID:        uuid.New(),
		ProjectID: req.ProjectID,
		Name:      req.Name,
	}

	if err := s.repo.Create(ctx, category); err != nil {
		return nil, err
	}

	return category, nil
}

func (s *CategoryService) GetByID(ctx context.Context, id uuid.UUID) (*model.PromptCategory, error) {
	category, err := s.repo.GetByID(ctx, id)
	if errors.Is(err, repository.ErrCategoryNotFound) {
		return nil, ErrCategoryNotFound
	}
	return category, err
}

func (s *CategoryService) List(ctx context.Context, projectID uuid.UUID) ([]model.PromptCategory, error) {
	return s.repo.ListByProjectID(ctx, projectID)
}

type UpdateCategoryRequest struct {
	Name string `json:"name"`
}

func (s *CategoryService) Update(ctx context.Context, id uuid.UUID, req *UpdateCategoryRequest) (*model.PromptCategory, error) {
	category, err := s.repo.GetByID(ctx, id)
	if errors.Is(err, repository.ErrCategoryNotFound) {
		return nil, ErrCategoryNotFound
	}
	if err != nil {
		return nil, err
	}

	category.Name = req.Name
	if err := s.repo.Update(ctx, category); err != nil {
		return nil, err
	}

	return category, nil
}

func (s *CategoryService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		return err
	}
	return nil
}
