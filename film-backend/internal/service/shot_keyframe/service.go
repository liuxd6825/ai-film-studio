package shot_keyframe

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"open-film-service/internal/ai/infrastructure/agent"
	"time"

	"open-film-service/internal/model"
	"open-film-service/internal/repository"

	"github.com/cloudwego/eino/schema"
	"github.com/google/uuid"
)

var (
	ErrInvalidUUID = errors.New("invalid UUID format")
	ErrNotFound    = errors.New("keyframe not found")
)

type Service struct {
	repo        *repository.ShotKeyframeRepository
	shotRepo    *repository.ShotRepository
	agentRunner *agent.AgentRunner
}

func NewService(repo *repository.ShotKeyframeRepository, shotRepo *repository.ShotRepository, agentRunner *agent.AgentRunner) *Service {
	return &Service{repo: repo, shotRepo: shotRepo, agentRunner: agentRunner}
}

func (s *Service) GetShotByID(id string) (*model.Shot, error) {
	return s.shotRepo.GetByID(id)
}

func (s *Service) CreateEntity(keyframe *model.ShotKeyframe) (*model.ShotKeyframe, error) {
	if keyframe.OrderNum <= 0 {
		maxFrameNum, err := s.repo.GetMaxFrameNumByShotID(keyframe.ShotID)
		if err != nil {
			maxFrameNum = 0
		}
		keyframe.OrderNum = maxFrameNum + 1
	}
	if keyframe.ID == "" {
		keyframe.ID = uuid.New().String()
	}
	keyframe.CreatedAt = time.Now()
	keyframe.UpdatedAt = time.Now()

	if err := s.repo.Create(keyframe); err != nil {
		return nil, err
	}
	return keyframe, nil
}

func (s *Service) Create(orgID, projectID, shotID, sessionID, imageURL, thumbnailURL, imagePrompt, actionPrompt, dialogue string, orderNum int, duration int) (*model.ShotKeyframe, error) {
	if orderNum <= 0 {
		maxFrameNum, err := s.repo.GetMaxFrameNumByShotID(shotID)
		if err != nil {
			maxFrameNum = 0
		}
		orderNum = maxFrameNum + 1
	}

	keyframe := &model.ShotKeyframe{
		ID:        uuid.New().String(),
		OrgID:     orgID,
		ProjectID: projectID,
		ShotID:    shotID,
		SessionID: sessionID,

		ImageURL:     imageURL,
		ThumbnailURL: thumbnailURL,

		// ImageDesc:    imageDesc,
		ImagePrompt:  imagePrompt,
		ActionPrompt: actionPrompt,
		Dialogue:     dialogue,
		OrderNum:     orderNum,

		Duration:  duration,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.repo.Create(keyframe); err != nil {
		return nil, err
	}
	return keyframe, nil
}

func (s *Service) GetByID(id string) (*model.ShotKeyframe, error) {
	keyframe, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}
	return keyframe, nil
}

func (s *Service) GetByShotID(shotID string) ([]model.ShotKeyframe, error) {
	return s.repo.GetByShotID(shotID)
}

func (s *Service) GetByProjectID(projectID string) ([]model.ShotKeyframe, error) {
	return s.repo.GetByProjectID(projectID)
}

func (s *Service) Update(id string, sessionID, imageURL, thumbnailURL, imageDesc, imagePrompt *string, actionDesc, dialogue *string, frameNum, sortOrder *int, cameraType, cameraSetting, cameraAngle, cameraMovement *string, duration *int, soundDesc *string) (*model.ShotKeyframe, error) {
	keyframe, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}

	if imageURL != nil {
		keyframe.ImageURL = *imageURL
	}
	if thumbnailURL != nil {
		keyframe.ThumbnailURL = *thumbnailURL
	}
	/*	if imageDesc != nil {
		keyframe.ImageDesc = *imageDesc
	}*/
	if imagePrompt != nil {
		keyframe.ImagePrompt = *imagePrompt
	}
	/*	if actionDesc != nil {
			keyframe.ActionDesc = *actionDesc
		}
		if dialogue != nil {
			keyframe.Dialogue = *dialogue
		}
		if frameNum != nil {
			keyframe.FrameNum = *frameNum
		}
		if sortOrder != nil {
			keyframe.SortOrder = *sortOrder
		}
		if cameraType != nil {
			keyframe.CameraType = *cameraType
		}
		if cameraSetting != nil {
			keyframe.CameraSetting = *cameraSetting
		}
		if cameraAngle != nil {
			keyframe.CameraAngle = *cameraAngle
		}
		if cameraMovement != nil {
			keyframe.CameraMovement = *cameraMovement
		}*/
	if duration != nil {
		keyframe.Duration = *duration
	}

	/*	if soundDesc != nil {
		keyframe.SoundDesc = *soundDesc
	}*/
	keyframe.UpdatedAt = time.Now()

	if err := s.repo.Update(keyframe); err != nil {
		return nil, err
	}
	return keyframe, nil
}

func (s *Service) Delete(id string) error {
	return s.repo.Delete(id)
}

type BatchUpdateItem struct {
	ID        string
	ShotID    string
	SortOrder int
	FrameNum  int
}

func (s *Service) BatchUpdate(items []BatchUpdateItem) error {
	for _, item := range items {
		keyframe, err := s.repo.GetByID(item.ID)
		if err != nil {
			continue
		}
		if item.ShotID != "" {
			keyframe.ShotID = item.ShotID
		}
		keyframe.UpdatedAt = time.Now()
		if err := s.repo.Update(keyframe); err != nil {
			return err
		}
	}
	return nil
}

func (s *Service) AIGenerateFromShotScript(ctx context.Context, agentId, projectId, shotID, shotPrompt string) ([]*model.ShotKeyframe, error) {
	if shotPrompt == "" {
		return nil, errors.New("invalid input: shot prompt is required")
	}

	messages := []*schema.Message{
		{Role: "user", Content: "/film-keyframe 只返回JSON结构体的关键帧数据，绝对不能有其他内容。 **镜头信息**: " + shotPrompt},
	}

	ctx, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()

	jsonStr, err := s.agentRunner.ChatJson(ctx, agentId, projectId, messages)
	if err != nil {
		return nil, fmt.Errorf("agent execution failed: %w", err)
	}

	var result KeyframeGenerateResult
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return nil, fmt.Errorf("parse AI response failed: %w", err)
	}

	var list []*model.ShotKeyframe
	for _, item := range result.Keyframes {
		item.OrderNum = item.OrderNum + 1
		if item.Duration <= 0 {
			item.Duration = 4
		}
		keyItem := &model.ShotKeyframe{
			ProjectID:      projectId,
			ID:             uuid.New().String(),
			ShotID:         shotID,
			ImagePrompt:    item.ImagePrompt,
			Duration:       item.Duration,
			OrderNum:       item.OrderNum,
			FrameNumber:    item.OrderNum,
			CameraType:     "中景",
			CameraAngle:    "平视",
			CameraMovement: "固定",
		}
		list = append(list, keyItem)
	}
	if err := s.repo.BatchCreate(list); err != nil {
		return nil, err
	}
	return list, nil
}
