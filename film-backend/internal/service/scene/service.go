package scene

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"open-film-service/internal/model"
	"open-film-service/internal/repository"
)

var (
	ErrInvalidUUID = errors.New("invalid UUID format")
	ErrNotFound    = errors.New("scene not found")
)

type Service struct {
	repo      *repository.SceneRepository
	imageRepo *repository.VisualImageRepository
}

func NewService(repo *repository.SceneRepository, imageRepo *repository.VisualImageRepository) *Service {
	return &Service{repo: repo, imageRepo: imageRepo}
}

func (s *Service) Create(orgID, projectID, name, desc, sceneType string) (*model.Scene, error) {
	sc := &model.Scene{
		VisualObject: model.VisualObject{
			ID:        uuid.New().String(),
			OrgID:     orgID,
			ProjectID: projectID,
			Name:      name,
			Desc:      desc,
			Kind:      "scene",
			Type:      sceneType,
			Status:    0,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
	}

	if err := s.repo.Create(sc); err != nil {
		return nil, err
	}
	return sc, nil
}

func (s *Service) GetByID(id string) (*model.Scene, error) {
	sc, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}
	return sc, nil
}

func (s *Service) GetByProjectID(projectID string) ([]model.Scene, error) {
	return s.repo.GetByProjectID(projectID)
}

func (s *Service) GetByProjectIDWithCovers(projectID string) ([]model.SceneResponse, error) {
	scenes, err := s.repo.GetByProjectID(projectID)
	if err != nil {
		return nil, err
	}

	if len(scenes) == 0 {
		return []model.SceneResponse{}, nil
	}

	ids := make([]string, len(scenes))
	for i, sc := range scenes {
		ids[i] = sc.ID
	}

	coverMap, err := s.imageRepo.GetCoverByVisualObjectIDs(ids)
	if err != nil {
		return nil, err
	}

	responses := make([]model.SceneResponse, len(scenes))
	for i, sc := range scenes {
		var coverURL string
		if cover, ok := coverMap[sc.ID]; ok && cover != nil {
			coverURL = cover.URL
		}
		responses[i] = sc.ToSceneResponse(coverURL)
	}

	return responses, nil
}

func (s *Service) Update(id, name, desc, sceneType string, status int) (*model.Scene, error) {
	sc, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}

	if name != "" {
		sc.Name = name
	}
	if desc != "" {
		sc.Desc = desc
	}
	if sceneType != "" {
		sc.Type = sceneType
	}
	sc.Status = status
	sc.UpdatedAt = time.Now()

	if err := s.repo.Update(sc); err != nil {
		return nil, err
	}
	return sc, nil
}

func (s *Service) Delete(id string) error {
	return s.repo.Delete(id)
}
