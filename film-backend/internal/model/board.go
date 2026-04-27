package model

type Board struct {
	ID          string `gorm:"type:char(36);primaryKey" json:"id"`
	ProjectID   string `gorm:"type:char(36);index" json:"projectId"`
	Name        string `gorm:"size:255;not null" json:"name"`
	Description string `gorm:"size:1000" json:"description"`
	SortOrder   int    `gorm:"default:0" json:"sortOrder"`
	Status      string `gorm:"size:50;default:'draft'" json:"status"`
	CreatedAt   int64  `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt   int64  `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (Board) TableName() string {
	return "board"
}
