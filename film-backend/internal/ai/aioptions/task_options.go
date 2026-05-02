package aioptions

import "time"

type NewTaskOptions struct {
	Model     string           `json:"model"`
	Prompt    string           `json:"prompt"`
	TaskType  TaskType         `json:"taskType"`  // 任务类型
	RefItems  []NewTaskRefItem `json:"refItems"`  // 引用项目
	Workspace string           `json:"workspace"` // 工作区

	Image ImageOptions `json:"image"`
	Video VideoOptions `json:"video"`
}

type Resolution string

const (
	Resolution2K Resolution = "2K"
	Resolution4K Resolution = "4K"
)

func (w Resolution) String() string {
	return string(w)
}

type ImageOptions struct {
	AspectRatio string     `json:"aspectRatio"` // 屏幕高宽比
	Resolution  Resolution `json:"resolution"`  // 分辨率 2K, 4K
}

type VideoOptions struct {
	GenerateAudio bool       `json:"generateAudio"` // 生成声音
	AspectRatio   string     `json:"aspectRatio"`   // 屏幕高宽比
	Duration      int        `json:"duration"`      // 时长
	Resolution    Resolution `json:"resolution"`    // 分辨率 2K, 4K
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
