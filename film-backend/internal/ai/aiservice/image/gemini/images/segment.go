package images

import (
	"regexp"
)

// Segment 代表解析后的一个片段，可能是文本，也可能是图片
type Segment struct {
	Type        string // "text" or "image"
	Content     string // 文本内容 或 图片Base64
	ImgFormat   string // mime type
	DisplayName string
}

// ParsePromptWithImages 解析 "Text @{img} Text" 格式
func ParsePromptWithImages(prompt string, imageMap map[string]string) []Segment {
	// 正则匹配 @{name}，例如 @{hero}
	re := regexp.MustCompile(`@\{([a-zA-Z0-9_]+)\}`)

	var segments []Segment
	lastIndex := 0

	// 查找所有匹配项的索引
	matches := re.FindAllStringSubmatchIndex(prompt, -1)

	for _, match := range matches {
		// match[0], match[1] 是整个 tag 的起止位置 (e.g. "@{hero}")
		// match[2], match[3] 是括号内 name 的起止位置 (e.g. "hero")

		start, end := match[0], match[1]
		nameStart, nameEnd := match[2], match[3]

		// 1. 添加 Tag 前面的文本 (如果有)
		if start > lastIndex {
			segments = append(segments, Segment{
				Type:    "text",
				Content: prompt[lastIndex:start],
			})
		}

		// 2. 查找图片并添加
		imgName := prompt[nameStart:nameEnd]
		if base64Str, ok := imageMap[imgName]; ok {
			segments = append(segments, Segment{
				Type:        "image",
				Content:     base64Str,
				ImgFormat:   "image/jpeg", // 简略，实际应用中建议自动检测
				DisplayName: imgName,
			})
		} else {
			// 如果没找到对应的图片，把标签当做普通文本保留，或者忽略
			// 这里我们选择保留原始文本，让模型自己理解（也许是泛指）
			segments = append(segments, Segment{
				Type:    "text",
				Content: prompt[start:end], // @{unknown}
			})
		}

		lastIndex = end
	}

	// 3. 添加剩余的文本
	if lastIndex < len(prompt) {
		segments = append(segments, Segment{
			Type:    "text",
			Content: prompt[lastIndex:],
		})
	}

	return segments
}
