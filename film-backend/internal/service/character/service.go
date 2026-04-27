package character

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"open-film-service/internal/model"
	"open-film-service/internal/repository"
)

var (
	ErrInvalidUUID = errors.New("invalid UUID format")
	ErrNotFound    = errors.New("character not found")
)

type Service struct {
	repo      *repository.CharacterRepository
	imageRepo *repository.VisualImageRepository
}

func NewService(repo *repository.CharacterRepository, imageRepo *repository.VisualImageRepository) *Service {
	return &Service{repo: repo, imageRepo: imageRepo}
}

func (s *Service) Create(orgID, projectID, name, desc, charType, appearance, personality, background, abilities, faction string) (*model.Character, error) {
	character := &model.Character{
		VisualObject: model.VisualObject{
			ID:        uuid.New().String(),
			OrgID:     orgID,
			ProjectID: projectID,
			Name:      name,
			Desc:      desc,
			Kind:      "character",
			Type:      charType,
			Status:    0,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		Appearance:  appearance,
		Personality: personality,
		Background:  background,
		Abilities:   abilities,
		Faction:     faction,
	}

	if err := s.repo.Create(character); err != nil {
		return nil, err
	}
	return character, nil
}

func (s *Service) GetByID(id string) (*model.Character, error) {
	character, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}
	return character, nil
}

func (s *Service) GetByProjectID(projectID string) ([]model.Character, error) {
	return s.repo.GetByProjectID(projectID)
}

func (s *Service) GetByProjectIDWithCovers(projectID string) ([]model.CharacterResponse, error) {
	characters, err := s.repo.GetByProjectID(projectID)
	if err != nil {
		return nil, err
	}

	if len(characters) == 0 {
		return []model.CharacterResponse{}, nil
	}

	ids := make([]string, len(characters))
	for i, c := range characters {
		ids[i] = c.ID
	}

	coverMap, err := s.imageRepo.GetCoverByVisualObjectIDs(ids)
	if err != nil {
		return nil, err
	}

	responses := make([]model.CharacterResponse, len(characters))
	for i, c := range characters {
		var coverURL string
		if cover, ok := coverMap[c.ID]; ok && cover != nil {
			coverURL = cover.URL
		}
		responses[i] = c.ToCharacterResponse(coverURL)
	}

	return responses, nil
}

func (s *Service) Update(id, name, desc, charType string, status int, appearance, personality, background, abilities, faction string) (*model.Character, error) {
	character, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}

	if name != "" {
		character.Name = name
	}
	if desc != "" {
		character.Desc = desc
	}
	if charType != "" {
		character.Type = charType
	}
	character.Status = status
	character.Appearance = appearance
	character.Personality = personality
	character.Background = background
	character.Abilities = abilities
	character.Faction = faction
	character.UpdatedAt = time.Now()

	if err := s.repo.Update(character); err != nil {
		return nil, err
	}
	return character, nil
}

func (s *Service) Delete(id string) error {
	return s.repo.Delete(id)
}
