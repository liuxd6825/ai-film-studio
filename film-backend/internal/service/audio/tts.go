package audio

import (
	"context"
	"open-film-service/internal/config"
)

type Service struct {
	cfg *config.ModelsConfig
}

func NewService(cfg config.ModelsConfig) *Service {
	return &Service{cfg: &cfg}
}

func (s *Service) Synthesize(ctx context.Context, text string, voice string) (string, error) {
	// TODO: Implement TTS calling logic
	return "audio_url_placeholder", nil
}
