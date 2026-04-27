package model

import "time"

// ShotKeyframe 关键帧
// 镜头下的关键画面
type ShotKeyframe struct {
	// ID 主键
	ID string `gorm:"type:varchar(50);primaryKey" json:"id"`
	// OrgID 组织ID
	OrgID string `gorm:"type:varchar(50);index" json:"orgId"`
	// ProjectID 项目ID
	ProjectID string `gorm:"type:varchar(50);index" json:"projectId"`
	// ShotID 所属镜头ID
	ShotID string `gorm:"type:varchar(50);index" json:"shotId"`
	// SessionID 生图会话ID
	SessionID string `gorm:"type:varchar(50)" json:"sessionId"`
	// OrderNum 顺序号
	OrderNum int `gorm:"type:int;default:0" json:"orderNum"`
	// ImageURL 图片地址
	ImageURL string `gorm:"type:varchar(500)" json:"imageUrl"`
	// ThumbnailURL 缩略图地址
	ThumbnailURL string `gorm:"type:varchar(500)" json:"thumbnailUrl"`
	// Description 画面描述
	// ImageDesc string `gorm:"type:text" json:"imageDesc"`
	// ImagePrompt 画面提示词
	ImagePrompt string `gorm:"type:text" json:"imagePrompt"`
	// ActionDescription 动作描述
	ActionPrompt string `gorm:"type:text" json:"actionPrompt"`
	// Dialogue 角色台词
	Dialogue string `gorm:"type:text" json:"dialogue"`

	// CameraShotType 机位类型（全景/中景/近景/特写等）
	CameraType string `gorm:"type:varchar(50)" json:"cameraShotType"`
	// CameraAngle 相机角度（平视/俯拍/仰拍等）
	CameraAngle string `gorm:"type:varchar(50)" json:"cameraAngle"`
	// CameraMovement 相机运动（固定/摇镜/推轨等）
	CameraMovement string `gorm:"type:varchar(50)" json:"cameraMovement"`
	// FrameNumber 帧号
	FrameNumber int `gorm:"type:int;default:1" json:"frameNumber"`

	// Duration 时长
	Duration int `gorm:"type:int;default:4" json:"duration"`
	// CreatedAt 创建时间
	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"createdAt"`
	// UpdatedAt 更新时间
	UpdatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"updatedAt"`
}

// TableName 返回数据库表名
func (ShotKeyframe) TableName() string {
	return "shot_keyframe"
}
