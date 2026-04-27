package skill

import (
	"context"
	"fmt"
	"regexp"
	"strings"
)

type Engine struct {
	skills map[string]Skill
	model  ModelAdapter
}

type ModelAdapter interface {
	Generate(ctx context.Context, messages []*Message) (string, error)
	Stream(ctx context.Context, messages []*Message) (<-chan string, error)
}

func NewEngine(model ModelAdapter) *Engine {
	return &Engine{
		skills: make(map[string]Skill),
		model:  model,
	}
}

func (e *Engine) Register(skill Skill) {
	e.skills[skill.Name()] = skill
}

func (e *Engine) Execute(ctx context.Context, name string, params map[string]interface{}) (*SkillResult, error) {
	skill, ok := e.skills[name]
	if !ok {
		return nil, ErrSkillNotFound
	}

	output, err := skill.Run(ctx, params)
	return &SkillResult{
		Name:      name,
		Output:    output,
		Artifacts: skill.Artifacts(),
		Error:     err,
	}, nil
}

func (e *Engine) ListSkills() []string {
	var names []string
	for name := range e.skills {
		names = append(names, name)
	}
	return names
}

func (e *Engine) GetSkill(name string) (Skill, bool) {
	skill, ok := e.skills[name]
	return skill, ok
}

func (e *Engine) ExecuteWithLLM(ctx context.Context, task string, params map[string]interface{}) (*SkillResult, error) {
	skillNames := e.ListSkills()
	prompt := fmt.Sprintf("Task: %s\nAvailable skills: %v\nSelect the best skill and explain why.", task, skillNames)

	messages := []*Message{
		{Role: "user", Content: prompt},
	}

	response, err := e.model.Generate(ctx, messages)
	if err != nil {
		return nil, err
	}

	selectedSkill := extractSkillName(response, skillNames)
	if selectedSkill == "" {
		return &SkillResult{
			Name:   "llm_fallback",
			Output: response,
		}, nil
	}

	return e.Execute(ctx, selectedSkill, params)
}

func extractSkillName(response string, skillNames []string) string {
	lowerResponse := strings.ToLower(response)
	for _, name := range skillNames {
		pattern := regexp.MustCompile(`(?i)\b` + regexp.QuoteMeta(name) + `\b`)
		if pattern.MatchString(lowerResponse) {
			return name
		}
	}
	return ""
}
