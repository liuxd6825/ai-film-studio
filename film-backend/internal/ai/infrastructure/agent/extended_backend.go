package agent

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	einoskill "github.com/cloudwego/eino/adk/middlewares/skill"
)

type extendedBackend struct {
	baseDir string
}

func newExtendedBackend(baseDir string) (*extendedBackend, error) {
	if baseDir == "" {
		return nil, fmt.Errorf("baseDir is empty")
	}
	return &extendedBackend{baseDir: baseDir}, nil
}

func (b *extendedBackend) List(ctx context.Context) ([]einoskill.FrontMatter, error) {
	entries, err := os.ReadDir(b.baseDir)
	if err != nil {
		return nil, err
	}

	var skills []einoskill.FrontMatter
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		skillName := entry.Name()
		skillPath := filepath.Join(b.baseDir, skillName, "SKILL.md")
		if _, err := os.Stat(skillPath); os.IsNotExist(err) {
			continue
		}

		desc := b.extractDescription(skillPath)
		skills = append(skills, einoskill.FrontMatter{
			Name:        skillName,
			Description: desc,
		})
	}

	return skills, nil
}

func (b *extendedBackend) Get(ctx context.Context, name string) (einoskill.Skill, error) {
	skillPath := filepath.Join(b.baseDir, name, "SKILL.md")
	content, err := os.ReadFile(skillPath)
	if err != nil {
		return einoskill.Skill{}, fmt.Errorf("skill file not found: %s", skillPath)
	}

	skillDir := filepath.Join(b.baseDir, name)
	parser := NewReferenceParser(skillDir)
	extendedContent, err := parser.ParseReferences(string(content))
	if err != nil {
		extendedContent = string(content)
	}

	return einoskill.Skill{
		FrontMatter: einoskill.FrontMatter{
			Name:        name,
			Description: b.extractDescription(skillPath),
		},
		Content:       extendedContent,
		BaseDirectory: skillDir,
	}, nil
}

func (b *extendedBackend) extractDescription(skillPath string) string {
	content, err := os.ReadFile(skillPath)
	if err != nil {
		return ""
	}

	lines := strings.Split(string(content), "\n")
	inFrontMatter := false
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "---") {
			if !inFrontMatter {
				inFrontMatter = true
				continue
			}
			break
		}
		if inFrontMatter && strings.HasPrefix(trimmed, "description:") {
			return strings.TrimPrefix(trimmed, "description:")
		}
	}
	return ""
}
