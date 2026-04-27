package document

import (
	"errors"

	"open-film-service/internal/model"
	"open-film-service/internal/repository"

	"github.com/google/uuid"
)

var (
	ErrInvalidUUID = errors.New("invalid UUID format")
	ErrNotFound    = errors.New("document not found")
)

func parseUUID(s string) (uuid.UUID, error) {
	return uuid.Parse(s)
}

type Service struct {
	repo *repository.DocumentRepository
}

func NewService(repo *repository.DocumentRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(projectID, title, content string, parentID *string) (*model.Document, error) {
	projectUUID, err := parseUUID(projectID)
	if err != nil {
		return nil, ErrInvalidUUID
	}

	doc := &model.Document{
		ID:        uuid.New().String(),
		ProjectID: projectUUID.String(),
		Title:     title,
		Content:   content,
		SortOrder: 0,
	}

	if parentID != nil {
		parentUUID, err := parseUUID(*parentID)
		if err != nil {
			return nil, ErrInvalidUUID
		}
		doc.ParentID = parentUUID.String()
	}

	if err := s.repo.Create(doc); err != nil {
		return nil, err
	}
	return doc, nil
}

func (s *Service) GetByID(id string) (*model.Document, error) {
	doc, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}
	return doc, nil
}

func (s *Service) GetByProjectID(projectID string) ([]model.Document, error) {
	return s.repo.GetByProjectID(projectID)
}

func (s *Service) Update(id, title, content string, parentID *string) (*model.Document, error) {
	doc, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}

	if title != "" {
		doc.Title = title
	}
	if content != "" {
		doc.Content = content
	}
	if parentID != nil {
		parentUUID, err := parseUUID(*parentID)
		if err != nil {
			return nil, ErrInvalidUUID
		}
		doc.ParentID = parentUUID.String()
	} else {
		doc.ParentID = ""
	}

	if err := s.repo.Update(doc); err != nil {
		return nil, err
	}
	return doc, nil
}

func (s *Service) Delete(id string) error {
	return s.repo.Delete(id)
}
