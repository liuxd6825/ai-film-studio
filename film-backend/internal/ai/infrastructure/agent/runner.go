package agent

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"open-film-service/internal/ai/infrastructure/chatmodel"
	"strings"

	"open-film-service/internal/config"

	"github.com/cloudwego/eino/adk"
	einoModel "github.com/cloudwego/eino/components/model"
	"github.com/cloudwego/eino/schema"
)

type AgentRunner struct {
	registry *AgentRegistry
	config   *config.Config
}

func NewAgentRunner(registry *AgentRegistry, cfg *config.Config) *AgentRunner {
	return &AgentRunner{
		registry: registry,
		config:   cfg,
	}
}

type ExecuteOptions struct {
	EnableStreaming *bool
}

func (e ExecuteOptions) GetEnableStreaming() bool {
	if e.EnableStreaming == nil {
		return true
	}
	return *e.EnableStreaming
}

func (e ExecuteOptions) SetEnableStreaming(val bool) ExecuteOptions {
	e.EnableStreaming = &val
	return e
}

func NewExecuteOptions(opts ...ExecuteOptions) ExecuteOptions {
	opt := ExecuteOptions{}
	for _, o := range opts {
		if o.EnableStreaming != nil {
			opt.EnableStreaming = o.EnableStreaming
		}
	}
	return opt
}

func (r *AgentRunner) Execute(ctx context.Context, agentId, projectID string, messages []*schema.Message, opts ...ExecuteOptions) (*adk.AsyncIterator[*adk.AgentEvent], error) {
	opt := NewExecuteOptions(opts...)

	cfg, err := r.GetAgentConfig(ctx, agentId)
	if err != nil {
		return nil, err
	}

	chatModel, err := r.GetModel(cfg.Provider, cfg.Model)
	if err != nil {
		return nil, fmt.Errorf("model not found: %s: %w", cfg.Model, err)
	}

	middlewares, err := r.registry.BuildMiddlewares(agentId)
	if err != nil {
		return nil, fmt.Errorf("failed to build middlewares: %w", err)
	}

	toolsConfig, err := r.registry.BuildToolsNode(agentId, projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to build tools node: %w", err)
	}

	instructions := cfg.Instructions
	if projectID != "" {
		instructions = fmt.Sprintf("%s\n\n[当前项目 project_id: %s]", cfg.Instructions, projectID)
	}

	agentCfg := &adk.ChatModelAgentConfig{
		Name:        cfg.Name,
		Description: cfg.Description,
		Model:       chatModel,
		Instruction: instructions,
		Handlers:    middlewares,
		ToolsConfig: adk.ToolsConfig{
			ToolsNodeConfig: *toolsConfig,
		},
	}

	agent, err := adk.NewChatModelAgent(ctx, agentCfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create agent: %w", err)
	}

	runner := adk.NewRunner(ctx, adk.RunnerConfig{
		Agent:           agent,
		EnableStreaming: opt.GetEnableStreaming(),
	})

	return runner.Run(ctx, messages), nil
}

func (h *AgentRunner) ChatJson(ctx context.Context, agentId, projectId string, messages []*schema.Message) (string, error) {
	msg, err := h.ChatMessage(ctx, agentId, projectId, messages)
	if err != nil {
		return "", err
	}
	return ExtractJSONFromMarkdown(msg)
}

func (h *AgentRunner) ChatMessage(ctx context.Context, agentId, projectID string, messages []*schema.Message, opts ...ExecuteOptions) (string, error) {

	var fullResponse strings.Builder
	if agentId == "" {
		agentId = h.GetDefaultAgent().Id
	}

	iterator, err := h.Execute(ctx, agentId, projectID, messages, opts...)
	if err != nil {
		log.Printf("[StreamAgent] Execute error: %v", err)
		return "", err
	}

	for {
		event, ok := iterator.Next()
		if !ok {
			break
		}

		// Process streaming output
		if event.Output != nil {
			if event.Output.MessageOutput.IsStreaming {
				stream := event.Output.MessageOutput.MessageStream
				for {
					msg, err := stream.Recv()
					if err == io.EOF {
						break // Stream completed successfully
					}
					if err != nil {
						// Check if this error will be retried (more streams coming)
						var willRetry *adk.WillRetryError
						if errors.As(err, &willRetry) {
							log.Printf("Attempt %d failed, retrying...", willRetry.RetryAttempt)
							break // Wait for next event with new stream
						}
						// Original error - won't retry, agent will stop and the next AgentEvent probably will be an error
						log.Printf("Final error (no retry): %v", err)
						break
					}
					fullResponse.WriteString(msg.Content)
				}
			}
		}
	}
	respTxt := fullResponse.String()
	_ = GetThinking(&respTxt)
	return respTxt, nil

}

func (r *AgentRunner) ListAgents() []*AgentConfig {
	return r.registry.ListAgents()
}

func (r *AgentRunner) GetAgentConfig(ctx context.Context, agentId string) (*AgentConfig, error) {
	cfg, err := r.registry.GetAgent(agentId)
	if err != nil {
		return nil, err
	}
	return cfg, nil
}

func (r *AgentRunner) GetDefaultAgent() *AgentConfig {
	return r.registry.GetDefaultAgent()
}

func (r *AgentRunner) GetModel(providerName, modelName string) (einoModel.ToolCallingChatModel, error) {
	modelCfg, ok := r.config.LangModels.GetModel(providerName, modelName)
	if !ok {
		return nil, errors.New(fmt.Sprintf("model not found %s %s", providerName, modelName))
	}
	if modelCfg == nil {
		return nil, fmt.Errorf("model not found in config: %s", modelName)
	}
	return chatmodel.NewChatModel(context.Background(), modelCfg)
}
