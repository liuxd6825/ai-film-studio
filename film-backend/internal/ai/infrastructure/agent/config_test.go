package agent

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadMasterConfig(t *testing.T) {
	dir := t.TempDir()
	masterPath := filepath.Join(dir, "master.yaml")
	os.WriteFile(masterPath, []byte("defaultAgent: test\n"), 0644)

	cfg, err := LoadMasterConfig(masterPath)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.DefaultAgent != "test" {
		t.Errorf("expected defaultAgent=test, got=%s", cfg.DefaultAgent)
	}
}

func TestValidateSkills(t *testing.T) {
	tempDir := t.TempDir()
	agentsDir := filepath.Join(tempDir, "agents")
	skillsDir := filepath.Join(tempDir, "skills")

	systemSkillDir := filepath.Join(skillsDir, "story_skills", "storyteller")
	os.MkdirAll(systemSkillDir, 0755)
	os.WriteFile(filepath.Join(systemSkillDir, "SKILL.md"), []byte("# Storyteller"), 0644)

	agentDir := filepath.Join(agentsDir, "assistant")
	agentSkillDir := filepath.Join(agentDir, "skills", "dialogue")
	os.MkdirAll(agentSkillDir, 0755)
	os.WriteFile(filepath.Join(agentSkillDir, "SKILL.md"), []byte("# Dialogue"), 0644)

	tests := []struct {
		name        string
		cfg         *AgentConfig
		expectError bool
	}{
		{
			name: "valid system skill",
			cfg: &AgentConfig{
				Name:   "assistant",
				Skills: []string{"system:story_skills/storyteller"},
			},
			expectError: false,
		},
		{
			name: "valid agent skill",
			cfg: &AgentConfig{
				Name:   "assistant",
				Skills: []string{"dialogue"},
			},
			expectError: false,
		},
		{
			name: "invalid system skill",
			cfg: &AgentConfig{
				Name:   "assistant",
				Skills: []string{"system:nonexistent/skill"},
			},
			expectError: true,
		},
		{
			name: "invalid agent skill",
			cfg: &AgentConfig{
				Name:   "assistant",
				Skills: []string{"nonexistent"},
			},
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.cfg.ValidateSkills(agentsDir, skillsDir)
			if tt.expectError && err == nil {
				t.Error("expected error, got nil")
			}
			if !tt.expectError && err != nil {
				t.Errorf("expected nil error, got %v", err)
			}
		})
	}
}

func TestLoadAgentConfigs(t *testing.T) {
	dir := t.TempDir()
	agentDir := filepath.Join(dir, "test")
	os.Mkdir(agentDir, 0755)
	agentPath := filepath.Join(agentDir, "agent.yaml")
	os.WriteFile(agentPath, []byte(`name: test
model: gpt-4o
instructions: "test instructions"
skills: ["skill1"]
`), 0644)

	configs, err := LoadAgentConfigs(dir)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(configs) != 1 {
		t.Errorf("expected 1 config, got=%d", len(configs))
	}

	if configs[0].Name != "test" {
		t.Errorf("expected name=test, got=%s", configs[0].Name)
	}
}
