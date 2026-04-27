package folder

import (
	"errors"

	"github.com/google/uuid"
	"open-film-service/internal/model"
	"open-film-service/internal/repository"
)

var (
	ErrInvalidUUID = errors.New("invalid UUID format")
	ErrNotFound    = errors.New("folder not found")
)

func parseUUID(s string) (uuid.UUID, error) {
	return uuid.Parse(s)
}

type Service struct {
	repo *repository.FolderRepository
}

func NewService(repo *repository.FolderRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(projectID, name string, parentID *string) (*model.Folder, error) {
	projectUUID, err := parseUUID(projectID)
	if err != nil {
		return nil, ErrInvalidUUID
	}

	folder := &model.Folder{
		ID:        uuid.New(),
		ProjectID: projectUUID,
		Name:      name,
		SortOrder: 0,
	}

	if parentID != nil {
		parentUUID, err := parseUUID(*parentID)
		if err != nil {
			return nil, ErrInvalidUUID
		}
		folder.ParentID = &parentUUID
	}

	if err := s.repo.Create(folder); err != nil {
		return nil, err
	}
	return folder, nil
}

func (s *Service) GetByID(id string) (*model.Folder, error) {
	folder, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}
	return folder, nil
}

func (s *Service) GetByProjectID(projectID string) ([]model.Folder, error) {
	return s.repo.GetByProjectID(projectID)
}

func (s *Service) Update(id, name string, parentID *string) (*model.Folder, error) {
	folder, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}

	if name != "" {
		folder.Name = name
	}
	if parentID != nil {
		parentUUID, err := parseUUID(*parentID)
		if err != nil {
			return nil, ErrInvalidUUID
		}
		folder.ParentID = &parentUUID
	} else {
		folder.ParentID = nil
	}

	if err := s.repo.Update(folder); err != nil {
		return nil, err
	}
	return folder, nil
}

func (s *Service) Delete(id string) error {
	return s.repo.Delete(id)
}
