package model

type PromptCategoryType string

const (
	CategoryConversation PromptCategoryType = "conversation" // 会话
	CategoryCanvasText    PromptCategoryType = "canvas_text" // 画布文字
	CategoryCanvasImage   PromptCategoryType = "canvas_image" // 画布图片
	CategoryCanvasVideo   PromptCategoryType = "canvas_video" // 画布视频
)

var AllPromptCategories = []PromptCategory{
	{Key: CategoryConversation, Name: "会话", Description: "对话类提示词"},
	{Key: CategoryCanvasText,   Name: "画布文字", Description: "画布文本节点提示词"},
	{Key: CategoryCanvasImage,   Name: "画布图片", Description: "画布图片生成提示词"},
	{Key: CategoryCanvasVideo,   Name: "画布视频", Description: "画布视频生成提示词"},
}

type PromptCategory struct {
	Key         PromptCategoryType `json:"key"`
	Name        string             `json:"name"`
	Description string             `json:"description"`
}