package file

import (
	"errors"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"open-film-service/internal/model"
	"open-film-service/internal/repository"
)

var (
	ErrInvalidUUID = errors.New("invalid UUID format")
	ErrNotFound    = errors.New("file not found")
)

func parseUUID(s string) (uuid.UUID, error) {
	return uuid.Parse(s)
}

type Service struct {
	repo       *repository.FileRepository
	projectSvc interface {
		GetByID(id string) (*model.Project, error)
	}
}

func NewService(repo *repository.FileRepository, projectSvc interface {
	GetByID(id string) (*model.Project, error)
}) *Service {
	return &Service{repo: repo, projectSvc: projectSvc}
}

func (s *Service) Create(projectID, name string, folderID *string, isDir bool, content string) (*model.File, error) {
	projectUUID, err := parseUUID(projectID)
	if err != nil {
		return nil, ErrInvalidUUID
	}

	if _, err := s.projectSvc.GetByID(projectID); err != nil {
		return nil, err
	}

	file := &model.File{
		ID:        uuid.New(),
		ProjectID: projectUUID,
		Name:      name,
		IsDir:     isDir,
		Content:   content,
		SortOrder: 0,
	}

	if folderID != nil {
		folderUUID, err := parseUUID(*folderID)
		if err != nil {
			return nil, ErrInvalidUUID
		}
		file.FolderID = &folderUUID
	}

	rootPath := filepath.Join("storage", "projects", projectID)
	file.RootPath = rootPath

	if isDir {
		file.Ext = ""
		file.FilePath = filepath.Join(file.RootPath, name)
	} else {
		ext := strings.ToLower(filepath.Ext(name))
		file.Ext = ext
		if folderID != nil {
			folder, _ := s.repo.GetByID(*folderID)
			if folder != nil {
				file.FilePath = filepath.Join(folder.FilePath, name)
			}
		} else {
			file.FilePath = filepath.Join(file.RootPath, name)
		}
	}

	if err := s.repo.Create(file); err != nil {
		return nil, err
	}
	return file, nil
}

func (s *Service) GetByID(id string) (*model.File, error) {
	file, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}
	return file, nil
}

func (s *Service) GetByProjectID(projectID string, folderID *string, allFiles bool) ([]model.File, error) {
	return s.repo.GetByProjectID(projectID, folderID, allFiles)
}

func (s *Service) Update(id, name string, folderID *string, content string) (*model.File, error) {
	file, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}

	if name != "" {
		file.Name = name
	}
	if folderID != nil {
		folderUUID, err := parseUUID(*folderID)
		if err != nil {
			return nil, ErrInvalidUUID
		}
		file.FolderID = &folderUUID
	} else {
		file.FolderID = nil
	}
	if content != "" {
		file.Content = content
	}

	if err := s.repo.Update(file); err != nil {
		return nil, err
	}
	return file, nil
}

func (s *Service) Delete(id string) error {
	file, err := s.repo.GetByID(id)
	if err != nil {
		return ErrNotFound
	}

	if !file.IsDir && file.FilePath != "" {
		os.Remove(file.FilePath)
	}

	return s.repo.Delete(id)
}

func (s *Service) UpdateFileSize(id string, size int64) error {
	file, err := s.repo.GetByID(id)
	if err != nil {
		return ErrNotFound
	}
	file.FileSize = size
	return s.repo.Update(file)
}
