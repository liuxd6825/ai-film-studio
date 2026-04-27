package shot_keyframe

type KeyframeGenerateResult struct {
	ShotID         string         `json:"shotId"`
	ContextSummary string         `json:"contextSummary"`
	SplitStrategy  string         `json:"splitStrategy"`
	Reasoning      string         `json:"reasoning"`
	Keyframes      []KeyframeItem `json:"keyframes"`
}

type KeyframeItem struct {
	OrderNum            int    `json:"orderNum"`
	ImageDesc           string `json:"imageDesc"`
	ImagePrompt         string `json:"imagePrompt"`
	ImageNegativePrompt string `json:"imageNegativePrompt"`
	Duration            int    `json:"duration"`
}
