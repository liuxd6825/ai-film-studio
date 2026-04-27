package middleware

import (
	"context"
	"log"
	"strings"
	"time"

	"github.com/cloudwego/eino/compose"
)

// SkillTracer 记录 Skill 调用信息
type SkillTracer struct {
	InvokedSkills []string
	CallTimes     map[string]time.Time
}

func NewSkillTracer() *SkillTracer {
	return &SkillTracer{
		InvokedSkills: make([]string, 0),
		CallTimes:     make(map[string]time.Time),
	}
}

func (s *SkillTracer) IsSkillTool(toolName string) bool {
	return strings.HasPrefix(toolName, "skill__") ||
		strings.Contains(toolName, "/")
}

func (s *SkillTracer) TrackSkill(ctx context.Context, toolName string) {
	if s.IsSkillTool(toolName) {
		s.InvokedSkills = append(s.InvokedSkills, toolName)
		s.CallTimes[toolName] = time.Now()
		log.Printf("[SKILL_TRACE] 📌 Skill invoked: %s", toolName)
	}
}

func (s *SkillTracer) GetInvokedSkills() []string {
	return s.InvokedSkills
}

func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

// BuildToolMiddleware 创建 Tool 中间件
func (s *SkillTracer) BuildToolMiddleware() compose.ToolMiddleware {
	log.Printf("[SKILL_TRACE] BuildToolMiddleware called")
	return compose.ToolMiddleware{
		EnhancedStreamable: func(endpoint compose.EnhancedStreamableToolEndpoint) compose.EnhancedStreamableToolEndpoint {
			return func(ctx context.Context, input *compose.ToolInput) (*compose.EnhancedStreamableToolOutput, error) {
				toolName := input.Name
				start := time.Now()
				log.Printf("[SKILL_TRACE] 🔄 EnhancedStreamable middleware called for tool: %s", toolName)
				if s.IsSkillTool(toolName) {
					s.TrackSkill(ctx, toolName)
				}
				result, err := endpoint(ctx, input)
				duration := time.Since(start)
				if s.IsSkillTool(toolName) {
					log.Printf("[SKILL_TRACE] ✅ Enhanced Stream skill completed: %s | Duration: %v", toolName, duration)
				}
				return result, err
			}
		},
		EnhancedInvokable: func(endpoint compose.EnhancedInvokableToolEndpoint) compose.EnhancedInvokableToolEndpoint {
			return func(ctx context.Context, input *compose.ToolInput) (*compose.EnhancedInvokableToolOutput, error) {
				toolName := input.Name
				start := time.Now()
				log.Printf("[SKILL_TRACE] 🔄 EnhancedInvokable middleware called for tool: %s", toolName)
				if s.IsSkillTool(toolName) {
					s.TrackSkill(ctx, toolName)
				}
				result, err := endpoint(ctx, input)
				duration := time.Since(start)
				if s.IsSkillTool(toolName) {
					log.Printf("[SKILL_TRACE] ✅ Enhanced Invokable skill completed: %s | Duration: %v", toolName, duration)
				}
				return result, err
			}
		},
		Invokable: func(next compose.InvokableToolEndpoint) compose.InvokableToolEndpoint {
			return func(ctx context.Context, input *compose.ToolInput) (*compose.ToolOutput, error) {
				toolName := input.Name
				start := time.Now()
				log.Printf("[SKILL_TRACE] 🔄 Invokable middleware called for tool: %s | Args: %s",
					toolName, truncateString(input.Arguments, 200))
				result, err := next(ctx, input)
				duration := time.Since(start)
				if s.IsSkillTool(toolName) {
					s.TrackSkill(ctx, toolName)
					log.Printf("[SKILL_TRACE] ✅ Skill completed: %s | Duration: %v", toolName, duration)
				} else {
					log.Printf("[SKILL_TRACE] ⚙️ Tool completed: %s | Duration: %v", toolName, duration)
				}
				return result, err
			}
		},
		Streamable: func(next compose.StreamableToolEndpoint) compose.StreamableToolEndpoint {
			return func(ctx context.Context, input *compose.ToolInput) (*compose.StreamToolOutput, error) {
				toolName := input.Name
				start := time.Now()
				log.Printf("[SKILL_TRACE] 🔄 Streamable middleware called for tool: %s", toolName)
				if s.IsSkillTool(toolName) {
					s.TrackSkill(ctx, toolName)
				}
				result, err := next(ctx, input)
				duration := time.Since(start)
				if s.IsSkillTool(toolName) {
					log.Printf("[SKILL_TRACE] ✅ Stream skill completed: %s | Duration: %v", toolName, duration)
				}
				return result, err
			}
		},
	}
}
