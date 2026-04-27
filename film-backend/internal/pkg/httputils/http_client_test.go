package httputils

import (
	"fmt"
	"strings"
	"testing"
)

func Test_HTTPClient(t *testing.T) {
	hc, err := newHttpClient("http://127.0.0.1:9981")
	if err != nil {
		t.Fatal(err)
		return
	}

	data := `
{
    "contents": [
      {
        "role": "user",
        "parts": [
          {
            "text": "INSERT_INPUT_HERE"
          },
        ]
      },
    ],
    "generationConfig": {
      "thinkingConfig": {
        "thinkingLevel": "HIGH",
      },
    },
    "tools": [
      {
        "googleSearch": {
        }
      },
    ],
}
`
	GEMINI_API_KEY := "$GEMINI_API_KEY"
	MODEL_ID := "gemini-3-pro-preview"
	GENERATE_CONTENT_API := "streamGenerateContent"

	contentType := "Content-Type: application/json"
	body := strings.NewReader(data)
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:%s?key=%s", MODEL_ID, GENERATE_CONTENT_API, GEMINI_API_KEY)
	resp, err := hc.Post(url, contentType, body)
	if err != nil {
		t.Fatal(err)
		return
	}
	resp.Body.Close()
	t.Log("Status", resp.Status)
}
