package agent

import (
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

var referencePattern = regexp.MustCompile(`@reference/([^\s\n]+)`)

type ReferenceParser struct {
	baseDir string
}

func NewReferenceParser(baseDir string) *ReferenceParser {
	return &ReferenceParser{baseDir: baseDir}
}

func (p *ReferenceParser) ParseReferences(content string) (string, error) {
	matches := referencePattern.FindAllStringSubmatch(content, -1)
	if len(matches) == 0 {
		return content, nil
	}

	result := content
	processedRefs := make(map[string]bool)

	for _, match := range matches {
		refPath := strings.TrimSpace(match[1])
		if processedRefs[refPath] {
			continue
		}
		processedRefs[refPath] = true

		fullPath := filepath.Join(p.baseDir, "references", refPath)
		refContent, err := os.ReadFile(fullPath)
		if err != nil {
			continue
		}

		refMarker := "@reference/" + refPath
		refSection := "\n\n## Reference: " + refPath + "\n\n" + string(refContent) + "\n"
		result = strings.ReplaceAll(result, refMarker, refSection)
	}

	return result, nil
}

func (p *ReferenceParser) ExtractReferences(content string) []string {
	matches := referencePattern.FindAllStringSubmatch(content, -1)
	var refs []string
	seen := make(map[string]bool)

	for _, match := range matches {
		refPath := strings.TrimSpace(match[1])
		if !seen[refPath] {
			seen[refPath] = true
			refs = append(refs, refPath)
		}
	}

	return refs
}
