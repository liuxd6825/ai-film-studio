package style

import (
	"errors"

	"github.com/google/uuid"
	"open-film-service/internal/model"
	"open-film-service/internal/repository"
)

var (
	ErrInvalidUUID = errors.New("invalid UUID format")
	ErrNotFound    = errors.New("style not found")
	ErrDuplicate   = errors.New("style already exists")
)

func parseUUID(s string) (uuid.UUID, error) {
	return uuid.Parse(s)
}

type Service struct {
	repo *repository.StyleRepository
}

func NewService(repo *repository.StyleRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(name string) (*model.Style, error) {
	style := &model.Style{
		ID:   uuid.New(),
		Name: name,
	}
	if err := s.repo.Create(style); err != nil {
		return nil, err
	}
	return style, nil
}

func (s *Service) GetByID(id string) (*model.Style, error) {
	parsed, err := parseUUID(id)
	if err != nil {
		return nil, ErrInvalidUUID
	}
	style, err := s.repo.GetByID(parsed.String())
	if err != nil {
		return nil, ErrNotFound
	}
	return style, nil
}

func (s *Service) List() ([]model.Style, error) {
	return s.repo.List()
}

func (s *Service) Update(id, name string) (*model.Style, error) {
	style, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}
	style.Name = name
	if err := s.repo.Update(style); err != nil {
		return nil, err
	}
	return style, nil
}

func (s *Service) Delete(id string) error {
	return s.repo.Delete(id)
}

func (s *Service) SeedDefaults() error {
	defaultStyles := []string{"真人", "动漫", "解说"}
	for i, name := range defaultStyles {
		_, err := s.repo.GetByName(name)
		if err != nil {
			style := &model.Style{
				ID:        uuid.New(),
				Name:      name,
				SortOrder: i,
			}
			s.repo.Create(style)
		}
	}
	return nil
}
