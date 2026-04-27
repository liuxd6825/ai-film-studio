package ai_model

type WorkMode string

const (
	WorkModeTextToImage WorkMode = "text-to-image"
	WorkModeTextToVideo WorkMode = "text-to-video"
)

type AIModel struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Provider string `json:"provider"`
}

type Service struct{}

func NewService() *Service {
	return &Service{}
}

func (s *Service) ListByWorkMode(workMode WorkMode) []AIModel {
	switch workMode {
	case WorkModeTextToImage:
		return []AIModel{
			{ID: "seedream_5.0_lite_web", Title: "WEB Seedream5-Lite", Provider: "jimeng"},
			{ID: "google_web", Title: "WEB Google", Provider: "web-google"},
			{ID: "gemini-3.1-flash-image-preview", Title: "Nano Banana2", Provider: "google"},
			{ID: "gemini-3-pro-image-preview", Title: "Nano Banana", Provider: "google"},
		}
	case WorkModeTextToVideo:
		return []AIModel{
			{ID: "seedance_2.0_fast_web", Title: "WEB SD2.0-Fast", Provider: "jimeng"},
		}
	default:
		return []AIModel{
			{ID: "dall-e-2", Title: "DALL-E 2", Provider: "openai"},
			{ID: "dall-e-3", Title: "DALL-E 3", Provider: "openai"},
		}
	}
}
