package agent

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"

	"open-film-service/internal/model"
	"open-film-service/internal/repository"
	"open-film-service/internal/service/skill"
)

var (
	ErrAgentNotFound = errors.New("agent not found")
	ErrNoModelConfig = errors.New("no model configuration found")
)

type Executor struct {
	agentRepo    *repository.AgentRepository
	modelCfgRepo *repository.ModelCfgRepository
	skillLoader  *skill.Loader
	skillEngine  *skill.Engine
}

func NewExecutor(
	agentRepo *repository.AgentRepository,
	modelCfgRepo *repository.ModelCfgRepository,
	skillLoader *skill.Loader,
	skillEngine *skill.Engine,
) *Executor {
	return &Executor{
		agentRepo:    agentRepo,
		modelCfgRepo: modelCfgRepo,
		skillLoader:  skillLoader,
		skillEngine:  skillEngine,
	}
}

type AgentConfig struct {
	ID           string
	Name         string
	Description  string
	Instructions string
	ModelCfgID   string
	Skills       []string
}

type ExecutionResult struct {
	AgentID        string
	Response       string
	ToolCalls      []ToolCallResult
	Artifacts      map[string]interface{}
	ConversationID string
}

type ToolCallResult struct {
	Tool   string
	Input  string
	Output string
	Error  error
}

func (e *Executor) GetAgentConfig(agentID string) (*AgentConfig, error) {
	agent, err := e.agentRepo.GetByID(agentID)
	if err != nil {
		return nil, ErrAgentNotFound
	}

	cfg := &AgentConfig{
		ID:           agent.ID,
		Name:         agent.Name,
		Description:  agent.Description,
		Instructions: agent.Instructions,
		ModelCfgID:   agent.ModelCfgID,
		Skills:       parseSkillsField(agent.Skills),
	}

	return cfg, nil
}

func (e *Executor) GetModelConfig(modelCfgID string) (*model.ModelCfg, error) {
	return e.modelCfgRepo.GetByID(modelCfgID)
}

func (e *Executor) ListSystemSkills() []*skill.SkillDefinition {
	return e.skillLoader.ListSkills()
}

func (e *Executor) GetSystemSkill(name string) (*skill.SkillDefinition, bool) {
	return e.skillLoader.GetSkill(name)
}

func (e *Executor) ExecuteSkill(ctx context.Context, skillName string, params map[string]interface{}) (*skill.SkillResult, error) {
	return e.skillEngine.Execute(ctx, skillName, params)
}

func (e *Executor) BuildSystemPrompt(agentCfg *AgentConfig) string {
	var skillsContent strings.Builder

	if len(agentCfg.Skills) > 0 {
		skillsContent.WriteString("\n\n## Available Skills\n\n")
		for _, skillName := range agentCfg.Skills {
			if sysSkill, ok := e.skillLoader.GetSkill(skillName); ok {
				skillsContent.WriteString(fmt.Sprintf("### %s\n", sysSkill.Name))
				skillsContent.WriteString(sysSkill.Description)
				skillsContent.WriteString("\n\n")
			}
		}
	}

	prompt := agentCfg.Instructions
	if skillsContent.Len() > 0 {
		prompt += skillsContent.String()
	}

	return prompt
}

func parseSkillsField(skillsStr string) []string {
	if skillsStr == "" {
		return nil
	}

	var skills []string
	if err := json.Unmarshal([]byte(skillsStr), &skills); err != nil {
		return []string{}
	}

	return skills
}

func (e *Executor) BindSkillsToAgent(ctx context.Context, agentCfg *AgentConfig) error {
	if len(agentCfg.Skills) == 0 {
		return nil
	}

	for _, skillName := range agentCfg.Skills {
		if sysSkill, ok := e.skillLoader.GetSkill(skillName); ok {
			e.skillEngine.Register(&skillBoundSkill{
				name:         sysSkill.Name,
				description:  sysSkill.Description,
				instructions: sysSkill.Instructions,
			})
			log.Printf("Bound skill %s to agent %s", skillName, agentCfg.Name)
		}
	}

	return nil
}

type skillBoundSkill struct {
	name         string
	description  string
	instructions string
}

func (s *skillBoundSkill) Name() string {
	return s.name
}

func (s *skillBoundSkill) Description() string {
	return s.description
}

func (s *skillBoundSkill) Run(ctx context.Context, params map[string]interface{}) (string, error) {
	return s.instructions, nil
}

func (s *skillBoundSkill) Artifacts() map[string]interface{} {
	return nil
}

type AgentExecutor interface {
	GetAgentConfig(agentID string) (*AgentConfig, error)
	ExecuteSkill(ctx context.Context, skillName string, params map[string]interface{}) (*skill.SkillResult, error)
	BuildSystemPrompt(agentCfg *AgentConfig) string
}
