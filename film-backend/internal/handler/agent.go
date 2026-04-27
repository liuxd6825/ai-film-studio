package handler

import (
	"encoding/json"
	"open-film-service/internal/ai/agent"

	"github.com/kataras/iris/v12"

	"github.com/cloudwego/eino/adk"
	"github.com/cloudwego/eino/schema"
)

type AgentHandler struct {
	runner *agent.AgentRunner
}

func NewAgentHandler(runner *agent.AgentRunner) *AgentHandler {
	return &AgentHandler{runner: runner}
}

func (h *AgentHandler) RegisterRoutes(party iris.Party) {
	if h.runner == nil {
		return
	}
	agents := party.Party("/agents")
	{
		agents.Get("/", h.ListAgents)
		agents.Get("/{name}", h.GetAgent)
		agents.Post("/{name}/execute", h.Execute)
		agents.Post("/execute", h.ExecuteDefault)
	}
}

func (h *AgentHandler) ListAgents(ctx iris.Context) {
	agents := h.runner.ListAgents()
	result := make([]map[string]interface{}, len(agents))
	for i, a := range agents {
		result[i] = map[string]interface{}{
			"id":           a.Id,
			"name":         a.Name,
			"description":  a.Description,
			"model":        a.Model,
			"instructions": a.Instructions,
			"skills":       a.Skills,
		}
	}
	ctx.JSON(iris.Map{
		"code": 0,
		"data": result,
	})
}

func (h *AgentHandler) GetAgent(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	cfg, err := h.runner.GetAgentConfig(ctx, id)
	if err != nil {
		ctx.StatusCode(404)
		ctx.JSON(iris.Map{"code": 404, "message": err.Error()})
		return
	}
	ctx.JSON(iris.Map{
		"code": 0,
		"data": map[string]interface{}{
			"id":           cfg.Id,
			"name":         cfg.Name,
			"description":  cfg.Description,
			"model":        cfg.Model,
			"instructions": cfg.Instructions,
			"skills":       cfg.Skills,
		},
	})
}

func (h *AgentHandler) Execute(ctx iris.Context) {
	name := ctx.Params().GetString("name")

	if name == "" {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "agent name is required"})
		return
	}

	var req struct {
		Messages  []*schema.Message `json:"messages"`
		ProjectID string            `json:"projectId"`
	}
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid request"})
		return
	}

	if len(req.Messages) == 0 {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "messages cannot be empty"})
		return
	}

	iterator, err := h.runner.Execute(ctx.Request().Context(), name, req.ProjectID, req.Messages)
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": err.Error()})
		return
	}

	h.streamEvents(ctx, iterator)
}

func (h *AgentHandler) ExecuteDefault(ctx iris.Context) {
	defaultAgent := h.runner.GetDefaultAgent()
	if defaultAgent == nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": "no default agent configured"})
		return
	}

	var req struct {
		Messages  []*schema.Message `json:"messages"`
		ProjectID string            `json:"projectId"`
	}
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid request"})
		return
	}

	if len(req.Messages) == 0 {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "messages cannot be empty"})
		return
	}

	iterator, err := h.runner.Execute(ctx.Request().Context(), defaultAgent.Name, req.ProjectID, req.Messages)
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": err.Error()})
		return
	}

	h.streamEvents(ctx, iterator)
}

func (h *AgentHandler) streamEvents(ctx iris.Context, iterator *adk.AsyncIterator[*adk.AgentEvent]) {
	ctx.ContentType("text/event-stream")
	ctx.Header("Cache-Control", "no-cache")

	for {
		event, ok := iterator.Next()
		if !ok {
			break
		}
		if event.Err != nil {
			ctx.JSON(iris.Map{"code": 500, "message": event.Err.Error()})
			return
		}

		data, _ := json.Marshal(event)
		ctx.Writef("data: %s\n\n", data)
	}
}
