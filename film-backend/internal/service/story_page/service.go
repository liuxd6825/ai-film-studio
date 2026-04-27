package story_page

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"open-film-service/internal/dto"
	"open-film-service/internal/model"
	"open-film-service/internal/repository"
)

var (
	ErrInvalidUUID = errors.New("invalid UUID format")
	ErrNotFound    = errors.New("story page not found")
)

type Service struct {
	repo *repository.StoryPageRepository
}

func NewService(repo *repository.StoryPageRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(orgID, projectID, boardID, title, desc, storyTime, weather string, sortOrder int) (*model.StoryPage, error) {
	boardUUID, err := uuid.Parse(boardID)
	if err != nil {
		return nil, ErrInvalidUUID
	}

	if sortOrder <= 0 {
		maxSortOrder, err := s.repo.GetMaxSortOrderByBoardID(boardID)
		if err != nil {
			maxSortOrder = 0
		}
		sortOrder = maxSortOrder + 1
	}

	storyPage := &model.StoryPage{
		ID:        uuid.New().String(),
		BoardID:   boardUUID,
		OrgID:     orgID,
		ProjectID: projectID,
		Title:     title,
		Desc:      desc,
		SortOrder: sortOrder,
		Status:    0,
		StoryTime: storyTime,
		Weather:   weather,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.repo.Create(storyPage); err != nil {
		return nil, err
	}
	return storyPage, nil
}

func (s *Service) GetByID(id string) (*model.StoryPage, error) {
	storyPage, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}
	return storyPage, nil
}

func (s *Service) GetByProjectID(projectID string) ([]model.StoryPage, error) {
	return s.repo.GetByProjectID(projectID)
}

func (s *Service) GetByBoardID(boardID string) ([]model.StoryPage, error) {
	return s.repo.GetByBoardID(boardID)
}

func (s *Service) Update(id, title, desc, storyTime, weather string, sortOrder, status int) (*model.StoryPage, error) {
	storyPage, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}

	if title != "" {
		storyPage.Title = title
	}
	if desc != "" {
		storyPage.Desc = desc
	}
	if storyTime != "" {
		storyPage.StoryTime = storyTime
	}
	if weather != "" {
		storyPage.Weather = weather
	}
	storyPage.SortOrder = sortOrder
	storyPage.Status = status
	storyPage.UpdatedAt = time.Now()

	if err := s.repo.Update(storyPage); err != nil {
		return nil, err
	}
	return storyPage, nil
}

func (s *Service) Delete(id string) error {
	return s.repo.Delete(id)
}

func (s *Service) AnalyzeContent(ctx context.Context, storyPageID string, req *dto.AnalyzeRequest) (*dto.AnalyzeResult, error) {
	// TODO: 调用 AI 模型分析剧本内容
	// 目前基于传入的 req.Content 进行简单的镜头拆分模拟
	content := req.Content
	if content == "" {
		content = "默认剧本内容"
	}

	// 简单按段落拆分作为镜头（后续替换为 AI 实际分析）
	paragraphs := splitIntoParagraphs(content)
	shots := make([]dto.ShotSuggestion, 0, len(paragraphs))

	for i, para := range paragraphs {
		if para == "" {
			continue
		}
		shotNumber := i + 1
		duration := calculateDuration(para, req.MaxDuration)
		shots = append(shots, dto.ShotSuggestion{
			Name:       generateShotTitle(shotNumber, para),
			Content:    para,
			StoryTime:  "日",
			Weather:    "晴",
			ShotNumber: shotNumber,
			Keyframes: []dto.KeyframeSuggestion{
				{FrameNumber: 1, ImageDesc: "关键帧1", ActionDesc: "动作描述", Dialogue: "角色台词", CameraType: "中景", CameraSetting: "f/2.8", CameraAngle: "平视", CameraMovement: "固定", Duration: fmt.Sprintf("%ds", duration/2), SoundDesc: "环境音"},
				{FrameNumber: 2, ImageDesc: "关键帧2", ActionDesc: "动作描述", Dialogue: "", CameraType: "近景", CameraSetting: "f/2.8", CameraAngle: "平视", CameraMovement: "固定", Duration: fmt.Sprintf("%ds", duration/2), SoundDesc: ""},
			},
		})
	}

	if len(shots) == 0 {
		shots = append(shots, dto.ShotSuggestion{
			Name:       "镜头1",
			Content:    content,
			StoryTime:  "日",
			Weather:    "晴",
			ShotNumber: 1,
			Keyframes: []dto.KeyframeSuggestion{
				{FrameNumber: 1, ImageDesc: "关键帧1", ActionDesc: "动作描述", Dialogue: "", CameraType: "中景", CameraSetting: "f/2.8", CameraAngle: "平视", CameraMovement: "固定", Duration: "5s", SoundDesc: ""},
			},
		})
	}

	return &dto.AnalyzeResult{Shots: shots}, nil
}

func splitIntoParagraphs(content string) []string {
	var paragraphs []string
	var current []byte
	for i := 0; i < len(content); i++ {
		if content[i] == '\n' {
			if len(current) > 0 {
				paragraphs = append(paragraphs, string(current))
				current = nil
			}
		} else {
			current = append(current, content[i])
		}
	}
	if len(current) > 0 {
		paragraphs = append(paragraphs, string(current))
	}
	return paragraphs
}

func calculateDuration(text string, maxDuration int) int {
	charCount := len(text)
	duration := charCount / 10
	if duration < 5 {
		duration = 5
	}
	if maxDuration > 0 && duration > maxDuration/3 {
		duration = maxDuration / 3
	}
	return duration
}

func generateShotTitle(shotNumber int, content string) string {
	firstLine := content
	if len(firstLine) > 20 {
		firstLine = firstLine[:20] + "..."
	}
	return fmt.Sprintf("镜头%d: %s", shotNumber, firstLine)
}
