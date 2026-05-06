package service

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"

	"open-film-service/internal/model"
	"open-film-service/internal/repository"
)

var ErrSystemPromptCannotBeModified = errors.New("system prompt cannot be modified")

type PromptAdminService struct {
	repo *repository.PromptRepository
}

func NewPromptAdminService(repo *repository.PromptRepository) *PromptAdminService {
	return &PromptAdminService{repo: repo}
}

type CreateSystemPromptRequest struct {
	ProjectID   uuid.UUID              `json:"projectId"`
	Title       string                 `json:"title"`
	Content     string                 `json:"content"`
	CategoryKey string                 `json:"categoryKey"`
	Tags        []string               `json:"tags"`
	Variables   []model.PromptVariable `json:"variables"`
	IsSystem    bool                   `json:"isSystem"`
}

func (s *PromptAdminService) Create(ctx context.Context, req *CreateSystemPromptRequest) (*model.Prompt, error) {
	var vars []model.PromptVariable
	if len(req.Variables) > 0 {
		vars = req.Variables
	} else {
		vars = ExtractVariables(req.Content)
	}
	varsJSON, err := marshalVariables(vars)
	if err != nil {
		return nil, err
	}

	prompt := &model.Prompt{
		ID:          uuid.New(),
		ProjectID:   req.ProjectID,
		Title:       req.Title,
		Content:     req.Content,
		CategoryKey: req.CategoryKey,
		Tags:        strings.Join(req.Tags, ","),
		Variables:   varsJSON,
		Version:     1,
		IsLatest:    true,
		IsSystem:    req.IsSystem,
	}

	if err := s.repo.Create(ctx, prompt); err != nil {
		return nil, err
	}

	if err := s.repo.CreateVersion(ctx, &model.PromptVersion{
		ID:       uuid.New(),
		PromptID: prompt.ID,
		Version:  1,
		Content:  req.Content,
	}); err != nil {
		return nil, err
	}

	return prompt, nil
}

func (s *PromptAdminService) GetByID(ctx context.Context, id uuid.UUID) (*model.Prompt, error) {
	prompt, err := s.repo.GetByIDAny(ctx, id)
	if errors.Is(err, repository.ErrPromptNotFound) {
		return nil, ErrPromptNotFound
	}
	return prompt, err
}

func (s *PromptAdminService) List(ctx context.Context, projectID uuid.UUID, categoryKey, tag string) ([]model.Prompt, error) {
	if categoryKey != "" {
		return s.repo.ListByCategoryKeyWithSystem(ctx, projectID, categoryKey)
	}
	return s.repo.ListByProjectIDWithSystem(ctx, projectID, tag)
}

type UpdateSystemPromptRequest struct {
	Title       string                 `json:"title"`
	Content     string                 `json:"content"`
	CategoryKey string                 `json:"categoryKey"`
	Tags        []string               `json:"tags"`
	Variables   []model.PromptVariable `json:"variables"`
}

func (s *PromptAdminService) Update(ctx context.Context, id uuid.UUID, req *UpdateSystemPromptRequest) (*model.Prompt, error) {
	prompt, err := s.repo.GetByIDAny(ctx, id)
	if errors.Is(err, repository.ErrPromptNotFound) {
		return nil, ErrPromptNotFound
	}
	if err != nil {
		return nil, err
	}

	prompt.IsLatest = false
	if err := s.repo.Update(ctx, prompt); err != nil {
		return nil, err
	}

	newVersion := prompt.Version + 1
	var vars []model.PromptVariable
	if len(req.Variables) > 0 {
		vars = req.Variables
	} else {
		vars = ExtractVariables(req.Content)
	}
	varsJSON, _ := marshalVariables(vars)

	newPrompt := &model.Prompt{
		ID:          uuid.New(),
		ProjectID:   prompt.ProjectID,
		Title:       req.Title,
		Content:     req.Content,
		CategoryKey: req.CategoryKey,
		Tags:        strings.Join(req.Tags, ","),
		Variables:   varsJSON,
		Version:     newVersion,
		IsLatest:    true,
		IsSystem:    prompt.IsSystem,
	}

	if err := s.repo.Create(ctx, newPrompt); err != nil {
		return nil, err
	}

	if err := s.repo.CreateVersion(ctx, &model.PromptVersion{
		ID:       uuid.New(),
		PromptID: prompt.ID,
		Version:  newVersion,
		Content:  req.Content,
	}); err != nil {
		return nil, err
	}

	return newPrompt, nil
}

func (s *PromptAdminService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *PromptAdminService) GetVersions(ctx context.Context, promptID uuid.UUID) ([]model.PromptVersion, error) {
	return s.repo.GetVersions(ctx, promptID)
}

func (s *PromptAdminService) RestoreVersion(ctx context.Context, promptID uuid.UUID, version int) (*model.Prompt, error) {
	oldVersion, err := s.repo.GetVersion(ctx, promptID, version)
	if err != nil {
		return nil, ErrVersionNotFound
	}

	currentPrompt, err := s.repo.GetByIDAny(ctx, promptID)
	if err != nil {
		return nil, err
	}

	versions, err := s.repo.GetVersions(ctx, promptID)
	if err != nil {
		return nil, err
	}

	newVersionNum := 1
	for _, v := range versions {
		if v.Version >= newVersionNum {
			newVersionNum = v.Version + 1
		}
	}

	currentPrompt.IsLatest = false
	if err := s.repo.Update(ctx, currentPrompt); err != nil {
		return nil, err
	}

	vars := ExtractVariables(oldVersion.Content)
	varsJSON, _ := marshalVariables(vars)

	newPrompt := &model.Prompt{
		ID:          uuid.New(),
		ProjectID:   currentPrompt.ProjectID,
		Title:       currentPrompt.Title,
		Content:     oldVersion.Content,
		CategoryKey: currentPrompt.CategoryKey,
		Tags:        currentPrompt.Tags,
		Variables:   varsJSON,
		Version:     newVersionNum,
		IsLatest:    true,
		IsSystem:    currentPrompt.IsSystem,
	}

	if err := s.repo.Create(ctx, newPrompt); err != nil {
		return nil, err
	}

	if err := s.repo.CreateVersion(ctx, &model.PromptVersion{
		ID:       uuid.New(),
		PromptID: currentPrompt.ID,
		Version:  newPrompt.Version,
		Content:  oldVersion.Content,
	}); err != nil {
		return nil, err
	}

	return newPrompt, nil
}