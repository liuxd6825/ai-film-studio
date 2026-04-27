package httputils

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
)

func NewHttpClient(proxyAddr string) (*http.Client, error) {
	// -------------------------------------------------------
	// 1. 构建带有代理配置的 HTTP Client
	// -------------------------------------------------------
	var httpClient *http.Client

	if proxyAddr != "" {
		// 1. 自动补全协议头 (容错处理)
		// 如果用户只传了 "127.0.0.1:9981"，默认为 http
		if !strings.HasPrefix(proxyAddr, "http") && !strings.HasPrefix(proxyAddr, "socks") {
			proxyAddr = "http://" + proxyAddr
		}

		// 解析代理地址
		proxyURL, err := url.Parse(proxyAddr)
		if err != nil {
			return nil, fmt.Errorf("invalid proxy url: %w", err)
		}

		// 创建自定义 Transport
		transport := &http.Transport{
			Proxy: http.ProxyURL(proxyURL),
			// 建议保留默认的连接复用设置，防止连接泄漏
			MaxIdleConns:    10,
			IdleConnTimeout: 30 * 0, // 默认
			// 2. 关键调整：代理环境建议关闭 KeepAlive，或者调短超时
			// 很多代理服务器对长连接支持不好，导致 connection reset
			DisableKeepAlives: true,
			ForceAttemptHTTP2: false, // 代理环境下强制 HTTP/1.1 通常更稳
		}

		httpClient = &http.Client{
			Transport: transport,
		}
		log.Printf("[GeminiProvider] Using Proxy: %s", proxyAddr)
	} else {
		// 如果没有显式设置代理，使用默认 Client
		// 注意：http.DefaultClient 默认会读取系统的 HTTP_PROXY 环境变量
		httpClient = http.DefaultClient
	}
	return httpClient, nil
}
