package handler

import (
	"github.com/kataras/iris/v12"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/agent"
	"open-film-service/internal/service/skill"
)

type SystemSkillHandler struct {
	loader   *skill.Loader
	executor *agent.Executor
}

func NewSystemSkillHandler(loader *skill.Loader, executor *agent.Executor) *SystemSkillHandler {
	return &SystemSkillHandler{
		loader:   loader,
		executor: executor,
	}
}

type ExecuteAgentRequest struct {
	AgentID string `json:"agent_id" validate:"required"`
	Message string `json:"message" validate:"required"`
}

type ExecuteSkillRequest struct {
	SkillName string                 `json:"skill_name" validate:"required"`
	Params    map[string]interface{} `json:"params"`
}

func (h *SystemSkillHandler) ListSkills(ctx iris.Context) {
	skills := h.loader.ListSkills()
	validator.Success(ctx, skills)
}

func (h *SystemSkillHandler) GetSkill(ctx iris.Context) {
	name := ctx.Params().GetString("name")
	skillDef, ok := h.loader.GetSkill(name)
	if !ok {
		validator.NotFoundError(ctx, "skill not found")
		return
	}
	validator.Success(ctx, skillDef)
}

func (h *SystemSkillHandler) ExecuteAgent(ctx iris.Context) {
	req, ok := validator.ParseAndValidate[ExecuteAgentRequest](ctx)
	if !ok {
		return
	}

	agentCfg, err := h.executor.GetAgentConfig(req.AgentID)
	if err != nil {
		validator.NotFoundError(ctx, "agent not found")
		return
	}

	h.executor.BindSkillsToAgent(ctx.Request().Context(), agentCfg)

	systemPrompt := h.executor.BuildSystemPrompt(agentCfg)

	validator.Success(ctx, iris.Map{
		"agent_id":      agentCfg.ID,
		"name":          agentCfg.Name,
		"system_prompt": systemPrompt,
		"bound_skills":  agentCfg.Skills,
		"message":       "Agent ready for execution with prompt and skills",
	})
}

func (h *SystemSkillHandler) GetAgentConfig(ctx iris.Context) {
	agentID := ctx.Params().GetString("agent_id")

	agentCfg, err := h.executor.GetAgentConfig(agentID)
	if err != nil {
		validator.NotFoundError(ctx, "agent not found")
		return
	}

	validator.Success(ctx, agentCfg)
}

func (h *SystemSkillHandler) ExecuteSkill(ctx iris.Context) {
	req, ok := validator.ParseAndValidate[ExecuteSkillRequest](ctx)
	if !ok {
		return
	}

	if req.Params == nil {
		req.Params = make(map[string]interface{})
	}

	result, err := h.executor.ExecuteSkill(ctx.Request().Context(), req.SkillName, req.Params)
	if validator.InternalServerError(ctx, err) {
		return
	}

	validator.Success(ctx, result)
}
