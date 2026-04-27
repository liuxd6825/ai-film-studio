#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PID_FILE="$PROJECT_DIR/server.pid"
APP_NAME="open-film-service"

do_stop() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo "Stopping $APP_NAME (PID: $PID)..."
            kill "$PID"

            for i in {1..10}; do
                if ! kill -0 "$PID" 2>/dev/null; then
                    echo "$APP_NAME stopped"
                    rm -f "$PID_FILE"
                    return
                fi
                sleep 1
            done

            echo "$APP_NAME did not stop gracefully, forcing..."
            kill -9 "$PID" 2>/dev/null || true
            rm -f "$PID_FILE"
            echo "$APP_NAME killed"
        else
            echo "$APP_NAME is not running (stale PID file)"
            rm -f "$PID_FILE"
        fi
    else
        echo "$APP_NAME is not running (no PID file)"
    fi
}

do_stop
