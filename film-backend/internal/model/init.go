package model

import (
	"gorm.io/gorm"
)

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&Org{},
		&User{},
		&Project{},
		&Style{},
		&Folder{},
		&File{},
		&APIKey{},
		&ModelCfg{},
		&Skill{},
		&Agent{},
		&Memory{},
		&ChatSession{},
		&ChatMessage{},
		&ComfyWorkflow{},
		&MediaTask{},
		&ExpertSession{},
		&Dictionary{},
		&Character{},
		&Scene{},
		&Prop{},
		&VisualImage{},
		&ImageSession{},
		&Board{},
		&StoryPage{},
		&Shot{},
		&ShotKeyframe{},
		&ShotCharacter{},
		&ShotScene{},
		&ShotProp{},
		&Prompt{},
		&PromptVersion{},
		&Canvas{},
		&CanvasFile{},
		&CanvasTask{},
		&CanvasTaskResult{},
	)
}
