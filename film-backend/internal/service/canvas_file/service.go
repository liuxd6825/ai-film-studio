package canvas_file

import (
	"errors"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"open-film-service/internal/model"
	"open-film-service/internal/repository"
)

var (
	ErrNotFound = errors.New("file not found")
)

type Service struct {
	repo *repository.CanvasFileRepository
}

func NewService(repo *repository.CanvasFileRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(projectID, canvasID, nodeID, filename string, ext string, size int64, contentType string, reader io.Reader) (*model.CanvasFile, error) {
	if ext == "" {
		ext = filepath.Ext(filename)
	}

	fileID := uuid.New().String()

	rootPath := filepath.Join("storage", "projects", projectID, "canvas", canvasID, "files")
	if err := os.MkdirAll(rootPath, 0755); err != nil {
		return nil, err
	}

	storedFilename := fileID + "_" + filename
	filePath := filepath.Join(rootPath, storedFilename)

	dst, err := os.Create(filePath)
	if err != nil {
		return nil, err
	}
	defer dst.Close()

	if _, err := io.Copy(dst, reader); err != nil {
		os.Remove(filePath)
		return nil, err
	}

	file := &model.CanvasFile{
		ID:          fileID,
		ProjectID:   projectID,
		CanvasID:    canvasID,
		NodeID:      nodeID,
		Name:        filename,
		FilePath:    filePath,
		FileSize:    size,
		Ext:         strings.ToLower(ext),
		ContentType: contentType,
	}

	if err := s.repo.Create(file); err != nil {
		os.Remove(filePath)
		return nil, err
	}

	return file, nil
}

func (s *Service) GetByID(id string) (*model.CanvasFile, error) {
	file, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}
	return file, nil
}

func (s *Service) Delete(id string) error {
	file, err := s.GetByID(id)
	if err != nil {
		return err
	}

	os.Remove(file.FilePath)

	return s.repo.Delete(id)
}

func (s *Service) MigrateFilePath(id string, newPath string) error {
	return s.repo.UpdateFilePath(id, newPath)
}

func (s *Service) ListAllFiles() ([]*model.CanvasFile, error) {
	return s.repo.ListAll()
}

func (s *Service) CountByNodeID(nodeID string) (int64, error) {
	return s.repo.CountByNodeID(nodeID)
}
