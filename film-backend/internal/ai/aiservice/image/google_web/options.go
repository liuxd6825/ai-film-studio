package google_web

import (
	"encoding/json"
	"time"
)

type Model string

const (
	ModelImageSeedream5Lite = "图片5.0 Lite"
)

func (w Model) String() string {
	return string(w)
}

type Resolution string

const (
	Resolution2K Resolution = "2K"
	Resolution4K Resolution = "4K"
)

func (w Resolution) String() string {
	return string(w)
}

type WorkType string

const (
	WorkType_ALL WorkType = "全能参考"
)

func (w WorkType) String() string {
	return string(w)
}

type GenerateRequest struct {
	Prompt      string   `json:"prompt"`
	Model       string   `json:"model"`
	AspectRatio string   `json:"aspect_ratio"`
	Seed        string   `json:"seed"`
	WorkType    string   `json:"work_type"`
	FilesUrl    []string `json:"files_url"`
	Resolution  string   `json:"resolution"` // 分辨率
	Workspace   string   `json:"workspace"`  // 工作区
}

type GenerateResponse struct {
	TaskID       string `json:"result_id"`  // 任务Id
	TaskUrl      string `json:"result_url"` // 取任务数据
	ErrorMessage string `json:"result"`     // 错误信息
}

type TaskResult struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"`
	Status    string    `json:"status"`
	Desc      string    `json:"desc"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	FileUrls  []string  `json:"file_urls"`
}

type RequestResultResponse struct {
	GetRequestResult
	Results []TaskResult `json:"tasks"`
}

type GetRequestResult struct {
	TaskID    string `json:"request_id"`
	Status    string `json:"status"`
	System    string `json:"system"`
	Desc      string `json:"desc"`
	Workspace string `json:"workspace"`
	Model     string `json:"model"`
}

type apiResponse struct {
	Code    int             `json:"code"`
	Message string          `json:"message"`
	Success bool            `json:"success"`
	Data    json.RawMessage `json:"data"`
}
