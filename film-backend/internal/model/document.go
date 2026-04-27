package model

type Document struct {
	ID        string `gorm:"type:char(36);primaryKey" json:"id"`
	ProjectID string `gorm:"type:char(36);index" json:"project_id"`
	ParentID  string `gorm:"type:char(36);index" json:"parent_id"`
	Title     string `gorm:"size:255;not null" json:"title"`
	Content   string `gorm:"type:text" json:"content"`
	SortOrder int    `gorm:"default:0" json:"sort_order"`
	CreatedAt int64  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt int64  `gorm:"autoUpdateTime" json:"updated_at"`
}

func (Document) TableName() string { return "document" }
