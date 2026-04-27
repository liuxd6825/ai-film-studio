#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PID_FILE="$PROJECT_DIR/server.pid"
LOG_FILE="$PROJECT_DIR/logs/server.log"
APP_NAME="open-film-service"

do_start() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo "$APP_NAME is already running (PID: $PID)"
            exit 0
        fi
        rm -f "$PID_FILE"
    fi

    mkdir -p "$(dirname "$LOG_FILE")"

    echo "Starting $APP_NAME..."

    cd "$PROJECT_DIR"

    export MINIMAX_API_KEY="${MINIMAX_API_KEY:-}"
    export OPENAI_API_KEY="${OPENAI_API_KEY:-}"
    export GEMINI_API_KEY="${GEMINI_API_KEY:-}"
    export VEO_API_KEY="${VEO_API_KEY:-}"

    nohup go run ./cmd/server/main.go \
        --config config.json \
        --log-level info \
        >> "$LOG_FILE" 2>&1 &

    SERVER_PID=$!
    echo $SERVER_PID > "$PID_FILE"

    sleep 2

    if kill -0 "$SERVER_PID" 2>/dev/null; then
        echo "$APP_NAME started (PID: $SERVER_PID)"
        echo "Log file: $LOG_FILE"
    else
        echo "Failed to start $APP_NAME"
        rm -f "$PID_FILE"
        exit 1
    fi
}

do_start
