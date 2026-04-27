package org

import (
	"github.com/google/uuid"
	"open-film-service/internal/model"
	"open-film-service/internal/repository"
)

type Service struct {
	repo *repository.OrgRepository
}

func NewService(repo *repository.OrgRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(name string) (*model.Org, error) {
	org := &model.Org{
		ID:     uuid.New(),
		Name:   name,
		Status: 1,
	}
	if err := s.repo.Create(org); err != nil {
		return nil, err
	}
	return org, nil
}

func (s *Service) GetByID(id string) (*model.Org, error) {
	return s.repo.GetByID(id)
}

func (s *Service) List() ([]model.Org, error) {
	return s.repo.List()
}

func (s *Service) Update(id, name string, status int) error {
	org, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if name != "" {
		org.Name = name
	}
	if status > 0 {
		org.Status = status
	}
	return s.repo.Update(org)
}

func (s *Service) Delete(id string) error {
	return s.repo.Delete(id)
}
