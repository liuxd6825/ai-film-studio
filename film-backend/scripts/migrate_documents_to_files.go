package main

import (
	"log"

	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

func main() {
	db, err := gorm.Open(sqlite.Open("sqlite.db"), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	db.AutoMigrate(&model.File{})

	var count int64
	db.Model(&model.Document{}).Count(&count)
	if count == 0 {
		log.Println("No documents to migrate")
		return
	}

	var documents []model.Document
	db.Find(&documents)

	for _, doc := range documents {
		projectID, _ := uuid.Parse(doc.ProjectID)
		parentID, _ := uuid.Parse(doc.ParentID)
		file := model.File{
			ID:        uuid.MustParse(doc.ID),
			ProjectID: projectID,
			FolderID:  &parentID,
			RootPath:  "storage/projects/" + doc.ProjectID,
			FilePath:  "storage/projects/" + doc.ProjectID + "/" + doc.Title + ".md",
			Name:      doc.Title + ".md",
			Ext:       ".md",
			IsDir:     false,
			Content:   doc.Content,
			SortOrder: doc.SortOrder,
			CreatedAt: doc.CreatedAt,
			UpdatedAt: doc.UpdatedAt,
		}
		db.Create(&file)
	}

	log.Printf("Migrated %d documents to files", len(documents))

	db.Migrator().DropTable(&model.Document{})
	log.Println("Dropped document table")
}
