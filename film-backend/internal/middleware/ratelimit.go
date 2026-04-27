package middleware

import (
	"sync"
	"time"

	"github.com/kataras/iris/v12"
)

type rateLimiter struct {
	mu       sync.Mutex
	requests map[string][]time.Time
	limit    int
	window   time.Duration
	stopCh   chan struct{}
}

func newRateLimiter(limit int, window time.Duration) *rateLimiter {
	rl := &rateLimiter{
		requests: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
		stopCh:   make(chan struct{}),
	}
	go rl.cleanup()
	return rl
}

func (rl *rateLimiter) cleanup() {
	ticker := time.NewTicker(time.Minute)
	go func() {
		for {
			select {
			case <-ticker.C:
				rl.mu.Lock()
				now := time.Now()
				windowStart := now.Add(-rl.window)
				for key, times := range rl.requests {
					var valid []time.Time
					for _, t := range times {
						if t.After(windowStart) {
							valid = append(valid, t)
						}
					}
					if len(valid) == 0 {
						delete(rl.requests, key)
					} else {
						rl.requests[key] = valid
					}
				}
				rl.mu.Unlock()
			case <-rl.stopCh:
				ticker.Stop()
				return
			}
		}
	}()
}

func (rl *rateLimiter) Stop() {
	close(rl.stopCh)
}

func (rl *rateLimiter) allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	windowStart := now.Add(-rl.window)

	var valid []time.Time
	for _, t := range rl.requests[key] {
		if t.After(windowStart) {
			valid = append(valid, t)
		}
	}

	if len(valid) >= rl.limit {
		rl.requests[key] = valid
		return false
	}

	rl.requests[key] = append(valid, now)
	return true
}

func RateLimit(limit int, window time.Duration) iris.Handler {
	limiter := newRateLimiter(limit, window)

	return func(ctx iris.Context) {
		key := ctx.GetHeader("X-API-Key")
		if key == "" {
			key = ctx.RemoteAddr()
		}

		if !limiter.allow(key) {
			ctx.StatusCode(429)
			ctx.JSON(iris.Map{"error": "rate limit exceeded"})
			ctx.StopExecution()
			return
		}

		ctx.Next()
	}
}
