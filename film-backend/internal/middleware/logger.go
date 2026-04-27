package middleware

import (
	"time"

	"github.com/kataras/iris/v12"
	"open-film-service/internal/logging"
)

func Logger() iris.Handler {
	return func(ctx iris.Context) {
		start := time.Now()

		ctx.Next()

		duration := time.Since(start)
		logging.WithFields(map[string]interface{}{
			"method":   ctx.Method(),
			"path":     ctx.Path(),
			"status":   ctx.GetStatusCode(),
			"duration": duration.String(),
			"ip":       ctx.RemoteAddr(),
		}).Info("request completed")
	}
}
