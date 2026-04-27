package model

import (
	"strings"

	"github.com/google/uuid"
)

type File struct {
	ID        uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	ProjectID uuid.UUID  `gorm:"type:char(36);index" json:"projectId"`
	FolderID  *uuid.UUID `gorm:"type:char(36);index" json:"folderId"`
	RootPath  string     `gorm:"size:512" json:"rootPath"`
	FilePath  string     `gorm:"size:512" json:"filePath"`
	Name      string     `gorm:"size:255" json:"name"`
	Ext       string     `gorm:"size:32" json:"ext"`
	IsDir     bool       `gorm:"default:false" json:"isDir"`
	Content   string     `gorm:"type:text" json:"content"`
	FileSize  int64      `gorm:"default:0" json:"fileSize"`
	SortOrder int        `gorm:"default:0" json:"sortOrder"`
	CreatedAt int64      `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt int64      `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (File) TableName() string { return "file" }

func GetFileType(ext string) string {
	ext = strings.ToLower(ext)
	switch ext {
	case ".md", ".txt", ".doc", ".docx":
		return "document"
	case ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg":
		return "image"
	case ".mp3", ".wav", ".ogg", ".m4a":
		return "audio"
	case ".mp4", ".avi", ".mov", ".webm":
		return "video"
	default:
		return "other"
	}
}
