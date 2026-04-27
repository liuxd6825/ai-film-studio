package agent

import (
	"io"
	"strings"
)

type ThinkingFilterWriter struct {
	writer  io.Writer
	buf     []byte
	state   int
	partial []byte
}

func NewThinkingFilterWriter(w io.Writer) *ThinkingFilterWriter {
	return &ThinkingFilterWriter{writer: w}
}

func (w *ThinkingFilterWriter) Write(p []byte) (n int, err error) {
	if len(p) == 0 {
		return 0, nil
	}

	data := append(w.partial, p...)
	w.partial = nil
	w.buf = append(w.buf, data...)

	for {
		if w.state == 0 {
			idx := strings.Index(string(w.buf), "<think>")
			if idx == -1 {
				remain := len(w.buf)
				if remain > 7 {
					remain -= 7
					if _, err := w.writer.Write(w.buf[:remain]); err != nil {
						return 0, err
					}
					w.buf = w.buf[remain:]
				}
				break
			}
			if idx > 0 {
				if _, err := w.writer.Write(w.buf[:idx]); err != nil {
					return 0, err
				}
			}
			w.buf = w.buf[idx+7:]
			w.state = 1
		} else {
			idx := strings.Index(string(w.buf), "</think>")
			if idx == -1 {
				break
			}
			w.buf = w.buf[idx+8:]
			w.state = 0
		}
	}

	return len(p), nil
}

func GetThinking(content *string) string {
	sb := strings.Builder{}
	for {
		think := getThinking(content)
		if think == "" {
			break
		}
		sb.WriteString(think)
	}
	return sb.String()
}

func getThinking(content *string) string {
	thinkStart := "<think>"
	thinkEnd := "</think>"
	startIdx := strings.Index(*content, thinkStart)
	if startIdx == -1 {
		return ""
	}
	endIdx := strings.Index(*content, thinkEnd)
	if endIdx == -1 {
		return ""
	}
	thinking := (*content)[startIdx+len(thinkStart) : endIdx]
	*content = strings.ReplaceAll(*content, thinkStart+thinking+thinkEnd, "")
	return thinking
}
