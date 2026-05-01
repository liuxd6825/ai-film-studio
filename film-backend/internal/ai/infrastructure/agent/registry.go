package agent

import (
	"context"
	"fmt"
	"log"
	"open-film-service/internal/ai/infrastructure/agent/middleware"
	"open-film-service/internal/ai/infrastructure/agent/tools"
	"path/filepath"
	"strings"
	"time"

	localbk "github.com/cloudwego/eino-ext/adk/backend/local"
	"github.com/cloudwego/eino/adk"
	"github.com/cloudwego/eino/adk/middlewares/filesystem"
	einoskill "github.com/cloudwego/eino/adk/middlewares/skill"
	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/compose"

	"open-film-service/internal/service/character"
	"open-film-service/internal/service/file"
	"open-film-service/internal/service/folder"
	"open-film-service/internal/service/prop"
	"open-film-service/internal/service/scene"
	"open-film-service/internal/service/skill"
)

const systemPrefix = "system:"

func IsSystemSkill(skillName string) bool {
	return strings.HasPrefix(skillName, systemPrefix)
}

type tracingBackend struct {
	backend einoskill.Backend
	tracer  *middleware.SkillTracer
}

func (b *tracingBackend) List(ctx context.Context) ([]einoskill.FrontMatter, error) {
	log.Printf("[SKILL_TRACE] 🔄 Skill backend List called")
	skills, err := b.backend.List(ctx)
	if err != nil {
		log.Printf("[SKILL_TRACE] ❌ Skill backend List error: %v", err)
		return nil, err
	}
	log.Printf("[SKILL_TRACE] 📋 Skill backend List returned %d skills:", len(skills))
	for _, s := range skills {
		log.Printf("[SKILL_TRACE]    - Name: %s, Description: %s", s.Name, s.Description)
	}
	return skills, nil
}

func (b *tracingBackend) Get(ctx context.Context, name string) (einoskill.Skill, error) {
	log.Printf("[SKILL_TRACE] 🔄 Skill backend Get called: %s", name)
	if b.tracer.IsSkillTool(name) {
		b.tracer.TrackSkill(ctx, name)
	}
	start := time.Now()

	// Strip "system:" prefix if present
	skillName := strings.TrimPrefix(name, systemPrefix)
	// Strip category prefix (film_skills/, code_skills/, story_skills/, etc.) if present
	skillName = stripCategoryPrefix(skillName)
	log.Printf("[SKILL_TRACE] 🔄 Skill backend Get with transformed name: %s", skillName)
	skill, err := b.backend.Get(ctx, skillName)

	duration := time.Since(start)
	if err != nil {
		log.Printf("[SKILL_TRACE] ❌ Skill backend Get FAILED: %s -> %s | Duration: %v | Error: %v", name, skillName, duration, err)
	} else {
		log.Printf("[SKILL_TRACE] ✅ Skill backend Get completed: %s -> %s | Duration: %v | Skill.Name: %s", name, skillName, duration, skill.Name)
	}
	return skill, err
}

// stripCategoryPrefix removes category prefix like "film_skills/" from skill name
func stripCategoryPrefix(name string) string {
	prefixes := []string{"film_skills/", "code_skills/", "story_skills/"}
	for _, prefix := range prefixes {
		if strings.HasPrefix(name, prefix) {
			return strings.TrimPrefix(name, prefix)
		}
	}
	return name
}

type AgentRegistry struct {
	agents       map[string]*AgentConfig
	defaultAgent string
	agentsDir    string
	skillLoader  *skill.Loader
	fileSvc      *file.Service
	folderSvc    *folder.Service
	charSvc      *character.Service
	sceneSvc     *scene.Service
	propSvc      *prop.Service
	skillTracer  *middleware.SkillTracer
}

func NewAgentRegistry(
	agentConfigs []*AgentConfig,
	defaultAgent string,
	agentsDir string,
	skillLoader *skill.Loader,
	fileSvc *file.Service,
	folderSvc *folder.Service,
	charSvc *character.Service,
	sceneSvc *scene.Service,
	propSvc *prop.Service,
) *AgentRegistry {
	agents := make(map[string]*AgentConfig)
	for _, cfg := range agentConfigs {
		agents[cfg.Id] = cfg
	}

	skillTracer := middleware.NewSkillTracer()
	return &AgentRegistry{
		agents:       agents,
		defaultAgent: defaultAgent,
		agentsDir:    agentsDir,
		skillLoader:  skillLoader,
		fileSvc:      fileSvc,
		folderSvc:    folderSvc,
		charSvc:      charSvc,
		sceneSvc:     sceneSvc,
		propSvc:      propSvc,
		skillTracer:  skillTracer,
	}
}

func (r *AgentRegistry) GetAgent(id string) (*AgentConfig, error) {
	cfg, ok := r.agents[id]
	if !ok {
		return nil, fmt.Errorf("agent id not found: %s", id)
	}
	return cfg, nil
}

func (r *AgentRegistry) GetDefaultAgent() *AgentConfig {
	return r.agents[r.defaultAgent]
}

func (r *AgentRegistry) ListAgents() []*AgentConfig {
	var configs []*AgentConfig
	for _, cfg := range r.agents {
		configs = append(configs, cfg)
	}
	return configs
}

func (r *AgentRegistry) SkillPath(agentId, skillName string) string {
	if IsSystemSkill(skillName) {
		return filepath.Join(r.skillLoader.GetSystemSkillsDir(), skillName[len(systemPrefix):], "SKILL.md")
	}
	return filepath.Join(r.agentsDir, agentId, "skills", skillName, "SKILL.md")
}

func (r *AgentRegistry) BuildMiddlewares(agentId string) ([]adk.ChatModelAgentMiddleware, error) {
	_, err := r.GetAgent(agentId)
	if err != nil {
		return nil, err
	}

	ctx := context.Background()
	var middlewares []adk.ChatModelAgentMiddleware

	fsBackend, err := localbk.NewBackend(ctx, &localbk.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to create fs backend: %w", err)
	}
	// fsBackend (*localbk.Local) does not implement io.Closer.
	// It is a read-only virtual filesystem that holds no open resources requiring cleanup.

	fsMw, err := filesystem.New(ctx, &filesystem.MiddlewareConfig{
		Backend: fsBackend,
		LsToolConfig: &filesystem.ToolConfig{
			Disable: true,
		},
		ReadFileToolConfig: &filesystem.ToolConfig{
			Disable: true,
		},
		WriteFileToolConfig: &filesystem.ToolConfig{
			Disable: true,
		},
		EditFileToolConfig: &filesystem.ToolConfig{
			Disable: true,
		},
		GlobToolConfig: &filesystem.ToolConfig{
			Disable: true,
		},
		GrepToolConfig: &filesystem.ToolConfig{
			Disable: true,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create fs middleware: %w", err)
	}
	middlewares = append(middlewares, fsMw)

	/*	if len(cfg.Skills) == 0 {
			return middlewares, nil
		}

		var systemSkills []string
		var agentSkills []string
		for _, skillName := range cfg.Skills {
			if IsSystemSkill(skillName) {
				systemSkills = append(systemSkills, skillName)
			} else {
				agentSkills = append(agentSkills, skillName)
			}
		}*/

	if true {
		agentSkillDir := r.skillLoader.GetAgentSkillsDir(agentId)
		skillBackend, err := newExtendedBackend(agentSkillDir)
		if err != nil {
			return nil, fmt.Errorf("failed to create agent skill backend: %w", err)
		}

		tracingSkillBackend := &tracingBackend{backend: skillBackend, tracer: r.skillTracer}
		skillMw, err := einoskill.NewMiddleware(ctx, &einoskill.Config{
			Backend: tracingSkillBackend,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to create agent skill middleware: %w", err)
		}
		middlewares = append(middlewares, skillMw)
	}

	if true {
		skillBackend, err := newExtendedBackend(r.skillLoader.GetSystemSkillsDir())
		if err != nil {
			return nil, fmt.Errorf("failed to create system skill backend: %w", err)
		}

		tracingSkillBackend := &tracingBackend{backend: skillBackend, tracer: r.skillTracer}
		skillMw, err := einoskill.NewMiddleware(ctx, &einoskill.Config{
			Backend: tracingSkillBackend,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to create system skill middleware: %w", err)
		}

		middlewares = append(middlewares, skillMw)

	}

	return middlewares, nil
}

func (r *AgentRegistry) BuildToolsNode(agentId, projectID string) (*compose.ToolsNodeConfig, error) {
	if r.fileSvc == nil && r.folderSvc == nil && r.charSvc == nil && r.sceneSvc == nil && r.propSvc == nil {
		return nil, nil
	}

	var toolBases []tool.BaseTool
	if r.fileSvc != nil {
		fileTools := tools.NewFileTools(r.fileSvc)
		toolBases = append(toolBases, fileTools.Tools()...)
	}
	if r.folderSvc != nil {
		folderTools := tools.NewFolderTools(r.folderSvc)
		toolBases = append(toolBases, folderTools.Tools()...)
	}
	if r.charSvc != nil {
		charTools := tools.NewCharacterTools(r.charSvc)
		toolBases = append(toolBases, charTools.Tools()...)
	}
	if r.sceneSvc != nil {
		sceneTools := tools.NewSceneTools(r.sceneSvc)
		toolBases = append(toolBases, sceneTools.Tools()...)
	}
	if r.propSvc != nil {
		propTools := tools.NewPropTools(r.propSvc)
		toolBases = append(toolBases, propTools.Tools()...)
	}

	if len(toolBases) == 0 {
		return nil, nil
	}

	// 添加 Skill 追踪中间件
	tracerMiddleware := r.skillTracer.BuildToolMiddleware()
	log.Printf("[REGISTRY] BuildToolsNode called with %d tools, tracerMiddleware: %+v", len(toolBases), tracerMiddleware)

	return &compose.ToolsNodeConfig{
		Tools:               toolBases,
		ToolCallMiddlewares: []compose.ToolMiddleware{tracerMiddleware},
		UnknownToolsHandler: func(ctx context.Context, name, input string) (string, error) {
			return fmt.Sprintf("unknown tool: %s", name), nil
		},
	}, nil
}
