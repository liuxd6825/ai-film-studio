package aioptions

import "time"

type NewTaskOptions struct {
	Provider      string           `json:"provider"`
	Model         string           `json:"model"`
	Prompt        string           `json:"prompt"`
	GenerateAudio bool             `json:"generateAudio"`
	VideoRatio    string           `json:"videoRatio"`
	VideoDuration int              `json:"videoDuration"`
	ShowWatermark bool             `json:"showWatermark"`
	RefItems      []NewTaskRefItem `json:"refItems"`   // 引用项目
	Resolution    string           `json:"resolution"` // 分辨率
	Workspace     string           `json:"workspace"`  // 工作区
	WorkType      string           `json:"workType"`
}

type ReferenceType string

const (
	ReferenceImage = "image"
	ReferenceVideo = "video"
	ReferenceAudio = "audio"
)

type NewTaskRefItem struct {
	Type ReferenceType
	Url  string
}

type TaskStatus int

const (
	TaskStatusPending   TaskStatus = 0
	TaskStatusCompleted TaskStatus = 1
	TaskStatusFailed    TaskStatus = 2
)

func (s TaskStatus) String() string {
	switch s {
	case TaskStatusCompleted:
		return "completed"
	case TaskStatusFailed:
		return "failed"
	case TaskStatusPending:
		return "pending"
	}
	return "none"
}

type TaskResultContent struct {
	TaskId           string
	Status           string
	VideoURL         string
	CompletionTokens int
	CreatedAt        time.Time
	UpdatedAt        time.Time
}
type TaskType string

const (
	TaskTypeImage = "image"
	TaskTypeVideo = "video"
	TaskTypeAudio = "audio"
)

func (t TaskType) String() string {
	return string(t)
}

type Task struct {
	Provider string
	TaskId   string
	Status   TaskStatus
	Model    string
	ErrorMsg string
	TaskType TaskType
	Contents []TaskResultContent
}

func NewTask(taskID, model string, status TaskStatus) *Task {
	return &Task{
		TaskId:   taskID,
		Status:   status,
		Model:    model,
		Contents: make([]TaskResultContent, 0),
	}
}

func (r *Task) AddContent(content TaskResultContent) {
	r.Contents = append(r.Contents, content)
}

type Model struct {
	Id    string `json:"id"`
	Title string `json:"title"`
}

type Provider struct {
	Id    string `json:"id"`
	Title string `json:"title"`
}
