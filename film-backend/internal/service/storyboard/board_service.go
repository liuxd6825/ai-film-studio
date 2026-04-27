package storyboard

import (
	"context"

	"github.com/google/uuid"

	"open-film-service/internal/model"
	"open-film-service/internal/repository"
)

type BoardService struct {
	repo *repository.BoardRepository
}

func NewBoardService(repo *repository.BoardRepository) *BoardService {
	return &BoardService{repo: repo}
}

func (s *BoardService) CreateBoard(ctx context.Context, projectID, name, description string) (*model.Board, error) {
	board := &model.Board{
		ID:          uuid.New().String(),
		ProjectID:   uuid.MustParse(projectID).String(),
		Name:        name,
		Description: description,
		Status:      "draft",
	}
	if err := s.repo.Create(board); err != nil {
		return nil, err
	}
	return board, nil
}

func (s *BoardService) ListBoards(ctx context.Context, projectID string) ([]model.Board, error) {
	return s.repo.ListByProjectID(projectID)
}

func (s *BoardService) GetBoard(ctx context.Context, id string) (*model.Board, error) {
	return s.repo.GetByID(id)
}

func (s *BoardService) UpdateBoard(ctx context.Context, board *model.Board) error {
	return s.repo.Update(board)
}

func (s *BoardService) DeleteBoard(ctx context.Context, id string) error {
	return s.repo.Delete(id)
}
