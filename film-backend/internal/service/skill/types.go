package skill

import (
	"context"
	"fmt"
)

var ErrSkillNotFound = fmt.Errorf("skill not found")

type Skill interface {
	Name() string
	Description() string
	Run(ctx context.Context, params map[string]interface{}) (string, error)
	Artifacts() map[string]interface{}
}

type SkillResult struct {
	Name      string
	Output    string
	Artifacts map[string]interface{}
	Error     error
}

type Message struct {
	Role    string
	Content string
}
