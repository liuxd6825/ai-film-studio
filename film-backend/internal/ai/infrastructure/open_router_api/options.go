package open_router_api

type GenerateRequest struct {
	Model         string  `json:"model"`
	Prompt        string  `json:"prompt"`
	Duration      int     `json:"duration,omitempty"`
	Resolution    string  `json:"resolution,omitempty"`
	AspectRatio   string  `json:"aspect_ratio,omitempty"`
	FrameImages   []any   `json:"frame_images,omitempty"`
	InputRefs     []any   `json:"input_references,omitempty"`
	GenerateAudio bool    `json:"generate_audio,omitempty"`
	Seed          int     `json:"seed,omitempty"`
	CallbackURL   string  `json:"callback_url,omitempty"`
	Provider      *Provider `json:"provider,omitempty"`
}

type Provider struct {
	Options map[string]map[string]any `json:"options,omitempty"`
}

type SubmitResponse struct {
	ID         string `json:"id"`
	PollingURL string `json:"polling_url"`
	Status     string `json:"status"`
}

type PollResponse struct {
	ID           string   `json:"id"`
	GenerationID string   `json:"generation_id"`
	PollingURL   string   `json:"polling_url"`
	Status       string   `json:"status"`
	UnsignedURLs []string `json:"unsigned_urls"`
	Usage        *Usage   `json:"usage,omitempty"`
	Error        string   `json:"error,omitempty"`
}

type Usage struct {
	Cost    float64 `json:"cost"`
	IsByok  bool    `json:"is_byok"`
}