package visual_image

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"open-film-service/internal/model"
	"open-film-service/internal/repository"
)

var (
	ErrInvalidUUID = errors.New("invalid UUID format")
	ErrNotFound    = errors.New("visual image not found")
)

type Service struct {
	repo *repository.VisualImageRepository
}

func NewService(repo *repository.VisualImageRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(orgID, projectID, name, desc, url, thumbnail string, visualObjectID *string) (*model.VisualImage, error) {
	visualImage := &model.VisualImage{
		ID:             uuid.New().String(),
		OrgID:          orgID,
		ProjectID:      projectID,
		Name:           name,
		Desc:           desc,
		URL:            url,
		Thumbnail:      thumbnail,
		VisualObjectID: visualObjectID,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := s.repo.Create(visualImage); err != nil {
		return nil, err
	}
	return visualImage, nil
}

func (s *Service) GetByID(id string) (*model.VisualImage, error) {
	visualImage, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}
	return visualImage, nil
}

func (s *Service) GetByProjectID(projectID string) ([]model.VisualImage, error) {
	return s.repo.GetByProjectID(projectID)
}

func (s *Service) GetByVisualObjectID(visualObjectID string) ([]model.VisualImage, error) {
	return s.repo.GetByVisualObjectID(visualObjectID)
}

func (s *Service) Update(id, name, desc, url, thumbnail string, visualObjectID *string) (*model.VisualImage, error) {
	visualImage, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}

	if name != "" {
		visualImage.Name = name
	}
	if desc != "" {
		visualImage.Desc = desc
	}
	if url != "" {
		visualImage.URL = url
	}
	if thumbnail != "" {
		visualImage.Thumbnail = thumbnail
	}
	visualImage.VisualObjectID = visualObjectID
	visualImage.UpdatedAt = time.Now()

	if err := s.repo.Update(visualImage); err != nil {
		return nil, err
	}
	return visualImage, nil
}

func (s *Service) Delete(id string) error {
	return s.repo.Delete(id)
}

func (s *Service) SetCoverImage(imageID, visualObjectID string) error {
	image, err := s.repo.GetByID(imageID)
	if err != nil {
		return ErrNotFound
	}
	if image.VisualObjectID == nil || *image.VisualObjectID != visualObjectID {
		return errors.New("image does not belong to this visual object")
	}
	return s.repo.SetCover(visualObjectID, imageID)
}
