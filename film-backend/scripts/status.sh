#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PID_FILE="$PROJECT_DIR/server.pid"
APP_NAME="open-film-service"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "$APP_NAME is running (PID: $PID)"
        exit 0
    else
        echo "$APP_NAME is not running (stale PID file)"
        exit 1
    fi
else
    echo "$APP_NAME is not running"
    exit 1
fi
