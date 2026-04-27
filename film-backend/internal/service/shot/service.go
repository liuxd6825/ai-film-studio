package shot

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"open-film-service/internal/ai/agent"
	"strconv"
	"strings"
	"time"

	"open-film-service/internal/model"
	"open-film-service/internal/repository"

	"github.com/cloudwego/eino/schema"
	"github.com/google/uuid"
)

var (
	ErrInvalidUUID  = errors.New("invalid UUID format")
	ErrNotFound     = errors.New("shot not found")
	ErrInvalidInput = errors.New("invalid input: script segment is required")
)

type Service struct {
	repo        *repository.ShotRepository
	agentRunner *agent.AgentRunner
}

func NewService(repo *repository.ShotRepository, agentRunner *agent.AgentRunner) *Service {
	return &Service{repo: repo, agentRunner: agentRunner}
}

func (s *Service) Create(orgID, projectID, storyPageID string, orderNum int, sceneType, content, timeFrame, weather string, sessionID *string, duration int, cameraAngleH, cameraAngleV, narrativePov, cameraMovement, framing, actionEmotion, dialogueSound, notes string) (*model.Shot, error) {
	// Auto-assign orderNum if not provided
	if orderNum == 0 {
		shots, err := s.repo.GetByStoryPageID(storyPageID)
		if err != nil {
			return nil, err
		}
		maxOrder := 0
		for _, shot := range shots {
			if shot.OrderNum > maxOrder {
				maxOrder = shot.OrderNum
			}
		}
		orderNum = maxOrder + 1
	}

	shot := &model.Shot{
		ID:             uuid.New().String(),
		OrgID:          orgID,
		ProjectID:      projectID,
		StoryPageID:    storyPageID,
		OrderNum:       orderNum,
		SceneType:      sceneType,
		Content:        content,
		TimeFrame:      timeFrame,
		Weather:        weather,
		SessionID:      sessionID,
		Duration:       duration,
		CameraAngleH:   cameraAngleH,
		CameraAngleV:   cameraAngleV,
		NarrativePov:   narrativePov,
		CameraMovement: cameraMovement,
		Framing:        framing,
		ActionEmotion:  actionEmotion,
		DialogueSound:  dialogueSound,
		Notes:          notes,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := s.repo.Create(shot); err != nil {
		return nil, err
	}
	return shot, nil
}

func (s *Service) GetByID(id string) (*model.Shot, error) {
	shot, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}
	return shot, nil
}

func (s *Service) GetByStoryPageID(storyPageID string) ([]model.Shot, error) {
	return s.repo.GetByStoryPageID(storyPageID)
}

func (s *Service) GetByProjectID(projectID string) ([]model.Shot, error) {
	return s.repo.GetByProjectID(projectID)
}

func (s *Service) Update(id string, sceneType, content, timeFrame, lighting, weather *string, sessionID *string, duration *int, cameraAngleH, cameraAngleV, narrativePov, cameraMovement, framing, actionEmotion, dialogueSound, notes, state *string) (*model.Shot, error) {
	shot, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}

	if sceneType != nil {
		shot.SceneType = *sceneType
	}
	if content != nil {
		shot.Content = *content
	}
	if timeFrame != nil {
		shot.TimeFrame = *timeFrame
	}
	if lighting != nil {
		shot.Lighting = *lighting
	}
	if weather != nil {
		shot.Weather = *weather
	}
	if sessionID != nil {
		shot.SessionID = sessionID
	}
	if duration != nil {
		shot.Duration = *duration
	}
	if cameraAngleH != nil {
		shot.CameraAngleH = *cameraAngleH
	}
	if cameraAngleV != nil {
		shot.CameraAngleV = *cameraAngleV
	}
	if narrativePov != nil {
		shot.NarrativePov = *narrativePov
	}
	if cameraMovement != nil {
		shot.CameraMovement = *cameraMovement
	}
	if framing != nil {
		shot.Framing = *framing
	}
	if actionEmotion != nil {
		shot.ActionEmotion = *actionEmotion
	}
	if dialogueSound != nil {
		shot.DialogueSound = *dialogueSound
	}
	if notes != nil {
		shot.Notes = *notes
	}
	if state != nil {
		shot.State = *state
	}
	shot.UpdatedAt = time.Now()

	if err := s.repo.Update(shot); err != nil {
		return nil, err
	}
	return shot, nil
}

func (s *Service) Delete(id string) error {
	return s.repo.Delete(id)
}

func (s *Service) DeleteBatch(ids []string) error {
	return s.repo.DeleteBatch(ids)
}

func (s *Service) GenerateFromScript(ctx context.Context, agentId, projectId, scriptSegment string) (*GenerateResult, error) {
	if scriptSegment == "" {
		return nil, ErrInvalidInput
	}

	messages := []*schema.Message{
		{Role: "user", Content: "/film-storyboard 只返回JSON结构体的分镜数据，绝对不能有其他内容。"},
		{Role: "user", Content: scriptSegment},
	}

	ctx, cancel := context.WithTimeout(ctx, 2*60*time.Second)
	defer cancel()

	jsonStr, err := s.agentRunner.ChatJson(ctx, agentId, projectId, messages)
	if err != nil {
		return nil, fmt.Errorf("agent execution failed: %w", err)
	}

	var generateResult GenerateResult
	if err := json.Unmarshal([]byte(jsonStr), &generateResult); err != nil {
		return nil, fmt.Errorf("parse AI response failed: %w", err)
	}

	if generateResult.Storyboard == nil || len(generateResult.Storyboard) == 0 {
		return nil, errors.New("invalid AI response: storyboard is empty")
	}

	for _, item := range generateResult.Storyboard {
		item.Duration = strings.ReplaceAll(item.Duration, "秒", "")
		item.Duration = strings.ReplaceAll(item.Duration, "s", "")
	}
	return &generateResult, nil
}

func (s *Service) CreateBatch(ctx context.Context, projectID, storyPageID string, req *CreateBatchRequest) ([]model.Shot, error) {
	if len(req.Shots) == 0 {
		return nil, errors.New("shots cannot be empty")
	}

	maxOrderNum, err := s.repo.GetMaxOrderNum(ctx, storyPageID)
	if err != nil {
		return nil, err
	}

	shots := make([]model.Shot, len(req.Shots))
	for i, item := range req.Shots {
		duration := 5
		if item.Duration != "" {
			d, _ := strconv.Atoi(strings.TrimSuffix(strings.TrimSuffix(item.Duration, "秒"), "s"))
			duration = d
		}

		shots[i] = model.Shot{
			ID:             uuid.New().String(),
			ProjectID:      projectID,
			StoryPageID:    storyPageID,
			OrderNum:       maxOrderNum + i,
			Content:        item.Content,
			SceneType:      item.SceneType,
			TimeFrame:      item.TimeFrame,
			Weather:        item.Weather,
			Lighting:       item.Lighting,
			ShotType:       item.ShotType,
			Duration:       duration,
			CameraMovement: item.CameraMovement,
			Framing:        item.Framing,
			ActionEmotion:  item.ActionEmotion,
			DialogueSound:  item.DialogueSound,
			Notes:          item.Notes,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}
	}

	if err := s.repo.CreateBatch(ctx, shots); err != nil {
		return nil, err
	}

	return shots, nil
}
