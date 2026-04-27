package dto

type AnalyzeRequest struct {
	DocumentID  string `json:"documentId"`
	Content     string `json:"content"`
	MaxDuration int    `json:"maxDuration"`
	ProjectID   string `json:"projectId"`
}

type KeyframeSuggestion struct {
	FrameNumber    int    `json:"frameNumber"`
	ImageDesc      string `json:"imageDesc"`
	ActionDesc     string `json:"actionDesc"`
	Dialogue       string `json:"dialogue"`
	CameraType     string `json:"cameraType"`
	CameraSetting  string `json:"cameraSetting"`
	CameraAngle    string `json:"cameraAngle"`
	CameraMovement string `json:"cameraMovement"`
	Duration       string `json:"duration"`
	SoundDesc      string `json:"soundDesc"`
	ImagePrompt    string `json:"imagePrompt"`
}

type ShotSuggestion struct {
	Name       string               `json:"name"`
	Content    string               `json:"content"`
	StoryTime  string               `json:"storyTime"`
	Weather    string               `json:"weather"`
	ShotNumber int                  `json:"shotNumber"`
	Keyframes  []KeyframeSuggestion `json:"keyframes"`
}

type AnalyzeResult struct {
	Shots []ShotSuggestion `json:"shots"`
}
