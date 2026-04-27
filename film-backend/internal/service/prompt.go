package service

import (
	"context"
	"encoding/json"
	"errors"
	"regexp"
	"strings"

	"github.com/google/uuid"

	"open-film-service/internal/model"
	"open-film-service/internal/repository"
)

var (
	ErrInvalidUUID     = errors.New("invalid UUID format")
	ErrPromptNotFound  = errors.New("prompt not found")
	ErrVersionNotFound = errors.New("version not found")
)

type PromptService struct {
	repo *repository.PromptRepository
}

func NewPromptService(repo *repository.PromptRepository) *PromptService {
	return &PromptService{repo: repo}
}

type CreatePromptRequest struct {
	ProjectID  uuid.UUID              `json:"projectId"`
	Title      string                 `json:"title"`
	Content    string                 `json:"content"`
	CategoryID uuid.UUID              `json:"categoryId"`
	Tags       []string               `json:"tags"`
	Variables  []model.PromptVariable `json:"variables"`
}

func (s *PromptService) Create(ctx context.Context, req *CreatePromptRequest) (*model.Prompt, error) {
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
		ID:         uuid.New(),
		ProjectID:  req.ProjectID,
		Title:      req.Title,
		Content:    req.Content,
		CategoryID: req.CategoryID,
		Tags:       strings.Join(req.Tags, ","),
		Variables:  varsJSON,
		Version:    1,
		IsLatest:   true,
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

func (s *PromptService) GetByID(ctx context.Context, id uuid.UUID) (*model.Prompt, error) {
	prompt, err := s.repo.GetByID(ctx, id)
	if errors.Is(err, repository.ErrPromptNotFound) {
		return nil, ErrPromptNotFound
	}
	return prompt, err
}

func (s *PromptService) List(ctx context.Context, projectID, categoryID uuid.UUID, tag string) ([]model.Prompt, error) {
	return s.repo.ListByProjectID(ctx, projectID, categoryID, tag)
}

type UpdatePromptRequest struct {
	Title      string                 `json:"title"`
	Content    string                 `json:"content"`
	CategoryID uuid.UUID              `json:"categoryId"`
	Tags       []string               `json:"tags"`
	Variables  []model.PromptVariable `json:"variables"`
}

func (s *PromptService) Update(ctx context.Context, id uuid.UUID, req *UpdatePromptRequest) (*model.Prompt, error) {
	prompt, err := s.repo.GetByID(ctx, id)
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
		ID:         uuid.New(),
		ProjectID:  prompt.ProjectID,
		Title:      req.Title,
		Content:    req.Content,
		CategoryID: req.CategoryID,
		Tags:       strings.Join(req.Tags, ","),
		Variables:  varsJSON,
		Version:    newVersion,
		IsLatest:   true,
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

func (s *PromptService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		return err
	}
	return nil
}

func (s *PromptService) GetVersions(ctx context.Context, promptID uuid.UUID) ([]model.PromptVersion, error) {
	return s.repo.GetVersions(ctx, promptID)
}

func (s *PromptService) RestoreVersion(ctx context.Context, promptID uuid.UUID, version int) (*model.Prompt, error) {
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
		ID:         uuid.New(),
		ProjectID:  currentPrompt.ProjectID,
		Title:      currentPrompt.Title,
		Content:    oldVersion.Content,
		CategoryID: currentPrompt.CategoryID,
		Tags:       currentPrompt.Tags,
		Variables:  varsJSON,
		Version:    newVersionNum,
		IsLatest:   true,
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

func ExtractVariables(content string) []model.PromptVariable {
	regex := regexp.MustCompile(`{{(.*?)}}`)
	matches := regex.FindAllStringSubmatch(content, -1)
	seen := make(map[string]bool)
	var vars []model.PromptVariable

	for _, match := range matches {
		name := strings.TrimSpace(match[1])
		if !seen[name] {
			seen[name] = true
			vars = append(vars, model.PromptVariable{
				Name: name,
				Type: "short_text",
			})
		}
	}
	return vars
}

func RenderPrompt(template string, values map[string]string) string {
	regex := regexp.MustCompile(`{{(.*?)}}`)
	return regex.ReplaceAllStringFunc(template, func(match string) string {
		key := strings.TrimSpace(match[2 : len(match)-2])
		if val, ok := values[key]; ok {
			return val
		}
		return match
	})
}

func marshalVariables(vars []model.PromptVariable) (string, error) {
	bytes, err := json.Marshal(vars)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}
