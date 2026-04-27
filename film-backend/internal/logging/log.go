package logging

import (
	"io"
	"os"
	"path/filepath"
	"sync"

	"github.com/sirupsen/logrus"
)

var (
	logger *logrus.Logger
	once   sync.Once
)

type Config struct {
	Dir   string
	Level string
}

func Init(cfg Config) *logrus.Logger {
	once.Do(func() {
		logger = logrus.New()

		switch cfg.Level {
		case "debug":
			logger.SetLevel(logrus.DebugLevel)
		case "info":
			logger.SetLevel(logrus.InfoLevel)
		case "warn":
			logger.SetLevel(logrus.WarnLevel)
		case "error":
			logger.SetLevel(logrus.ErrorLevel)
		default:
			logger.SetLevel(logrus.InfoLevel)
		}

		if err := os.MkdirAll(cfg.Dir, 0755); err != nil {
			logger.Warnf("failed to create log directory: %v", err)
		}

		logger.SetFormatter(&logrus.JSONFormatter{
			TimestampFormat: "2006-01-02 15:04:05",
		})

		logFile := filepath.Join(cfg.Dir, "app.log")
		file, err := os.OpenFile(logFile, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
		if err == nil {
			writers := io.MultiWriter(os.Stdout, file)
			logger.SetOutput(writers)
		} else {
			logger.Warnf("failed to open log file: %v, logging to stdout only", err)
		}
	})
	return logger
}

func GetLogger() *logrus.Logger {
	if logger == nil {
		logger = logrus.New()
	}
	return logger
}

func WithFields(fields map[string]interface{}) *logrus.Entry {
	return GetLogger().WithFields(fields)
}

func Info(args ...interface{}) {
	GetLogger().Info(args...)
}

func Debug(args ...interface{}) {
	GetLogger().Debug(args...)
}

func Warn(args ...interface{}) {
	GetLogger().Warn(args...)
}

func Error(args ...interface{}) {
	GetLogger().Error(args...)
}

func Fatal(args ...interface{}) {
	GetLogger().Fatal(args...)
}
