package ai

import (
	"context"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/config"
)

type AiAudioService struct {
	cfg *config.Config
}

func NewAiAudioService(cfg *config.Config) *AiAudioService {
	return &AiAudioService{
		cfg: cfg,
	}
}

func (s *AiAudioService) NewTask(ctx context.Context, opts aioptions.NewTaskOptions) (*aioptions.Task, error) {
	return aioptions.NewTask("placeholder_task_id", opts.Model, aioptions.TaskStatusCompleted), nil
}

func (s *AiAudioService) GetTask(ctx context.Context, model, taskID string) (*aioptions.Task, error) {
	return aioptions.NewTask(taskID, model, aioptions.TaskStatusCompleted), nil
}

func (s *AiAudioService) GetModels() []aioptions.Model {
	return []aioptions.Model{
		{Id: "tts-1", Title: "TTS Model 1"},
	}
}