package middleware

import (
	"crypto/sha256"
	"encoding/hex"
	"log"
	"time"

	"github.com/kataras/iris/v12"
	"open-film-service/internal/model"
	"open-film-service/internal/repository"
)

func Auth(apiKeyRepo *repository.APIKeyRepository) iris.Handler {
	return func(ctx iris.Context) {
		apiKey := ctx.GetHeader("X-API-Key")
		if apiKey == "" {
			ctx.StatusCode(401)
			ctx.JSON(iris.Map{"error": "missing API key"})
			ctx.StopExecution()
			return
		}

		keyHash := hashKey(apiKey)

		storedKey, err := apiKeyRepo.GetByKeyHash(keyHash)
		if err != nil || storedKey == nil {
			ctx.StatusCode(401)
			ctx.JSON(iris.Map{"error": "invalid API key"})
			ctx.StopExecution()
			return
		}

		if storedKey.Status != model.APIKeyStatusActive {
			ctx.StatusCode(401)
			ctx.JSON(iris.Map{"error": "API key is inactive"})
			ctx.StopExecution()
			return
		}

		if storedKey.ExpiresAt > 0 && time.Now().Unix() > storedKey.ExpiresAt {
			ctx.StatusCode(401)
			ctx.JSON(iris.Map{"error": "API key has expired"})
			ctx.StopExecution()
			return
		}

		storedKey.LastUsedAt = time.Now().Unix()
		go func() {
			if err := apiKeyRepo.Update(storedKey); err != nil {
				log.Printf("failed to update API key last used: %v", err)
			}
		}()

		ctx.Values().Set("api_key", apiKey)
		ctx.Values().Set("api_key_hash", keyHash)
		ctx.Values().Set("org_id", storedKey.OrgID)
		ctx.Values().Set("project_id", storedKey.ProjectID)

		ctx.Next()
	}
}

func hashKey(key string) string {
	hash := sha256.Sum256([]byte(key))
	return hex.EncodeToString(hash[:])
}
