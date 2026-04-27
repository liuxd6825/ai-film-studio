package prop

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"open-film-service/internal/model"
	"open-film-service/internal/repository"
)

var (
	ErrInvalidUUID = errors.New("invalid UUID format")
	ErrNotFound    = errors.New("prop not found")
)

type Service struct {
	repo      *repository.PropRepository
	imageRepo *repository.VisualImageRepository
}

func NewService(repo *repository.PropRepository, imageRepo *repository.VisualImageRepository) *Service {
	return &Service{repo: repo, imageRepo: imageRepo}
}

func (s *Service) Create(orgID, projectID, name, desc, propType string) (*model.Prop, error) {
	prop := &model.Prop{
		VisualObject: model.VisualObject{
			ID:        uuid.New().String(),
			OrgID:     orgID,
			ProjectID: projectID,
			Name:      name,
			Desc:      desc,
			Kind:      "prop",
			Type:      propType,
			Status:    0,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
	}

	if err := s.repo.Create(prop); err != nil {
		return nil, err
	}
	return prop, nil
}

func (s *Service) GetByID(id string) (*model.Prop, error) {
	prop, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}
	return prop, nil
}

func (s *Service) GetByProjectID(projectID string) ([]model.Prop, error) {
	return s.repo.GetByProjectID(projectID)
}

func (s *Service) GetByProjectIDWithCovers(projectID string) ([]model.PropResponse, error) {
	props, err := s.repo.GetByProjectID(projectID)
	if err != nil {
		return nil, err
	}

	if len(props) == 0 {
		return []model.PropResponse{}, nil
	}

	ids := make([]string, len(props))
	for i, p := range props {
		ids[i] = p.ID
	}

	coverMap, err := s.imageRepo.GetCoverByVisualObjectIDs(ids)
	if err != nil {
		return nil, err
	}

	responses := make([]model.PropResponse, len(props))
	for i, p := range props {
		var coverURL string
		if cover, ok := coverMap[p.ID]; ok && cover != nil {
			coverURL = cover.URL
		}
		responses[i] = p.ToPropResponse(coverURL)
	}

	return responses, nil
}

func (s *Service) Update(id, name, desc, propType string, status int) (*model.Prop, error) {
	prop, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}

	if name != "" {
		prop.Name = name
	}
	if desc != "" {
		prop.Desc = desc
	}
	if propType != "" {
		prop.Type = propType
	}
	prop.Status = status
	prop.UpdatedAt = time.Now()

	if err := s.repo.Update(prop); err != nil {
		return nil, err
	}
	return prop, nil
}

func (s *Service) Delete(id string) error {
	return s.repo.Delete(id)
}
