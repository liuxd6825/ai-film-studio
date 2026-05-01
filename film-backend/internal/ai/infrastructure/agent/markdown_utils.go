package agent

import (
	"strings"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/text"
)

func ExtractJSONFromMarkdown(markdown string) (string, error) {
	source := []byte(markdown)
	reader := text.NewReader(source)

	parser := goldmark.DefaultParser()
	document := parser.Parse(reader)

	var jsonBlocks []string

	ast.Walk(document, func(n ast.Node, entering bool) (ast.WalkStatus, error) {
		if !entering {
			return ast.WalkContinue, nil
		}

		if fb, ok := n.(*ast.FencedCodeBlock); ok {
			if isJSONFencedCodeBlock(fb, source) {
				jsonContent := extractFencedCodeBlockContent(fb, source)
				jsonBlocks = append(jsonBlocks, jsonContent)
			}
		}
		return ast.WalkContinue, nil
	})

	if len(jsonBlocks) == 0 {
		return "", nil
	}

	return jsonBlocks[0], nil
}

func isJSONFencedCodeBlock(node *ast.FencedCodeBlock, source []byte) bool {
	info := node.Info
	if info == nil {
		return false
	}
	language := info.Text(source)
	return strings.EqualFold(strings.TrimSpace(string(language)), "json")
}

func extractFencedCodeBlockContent(node *ast.FencedCodeBlock, source []byte) string {
	lines := make([]string, 0, node.Lines().Len())
	for i := 0; i < node.Lines().Len(); i++ {
		line := node.Lines().At(i)
		lines = append(lines, string(line.Value(source)))
	}
	return strings.Join(lines, "")
}
