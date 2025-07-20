#!/bin/bash

# A script to start all development services for the notification system.
# It starts Docker containers, all Go microservices in the background,
# and the React frontend in the foreground.

# --- Cleanup Function ---
# This function will be called when the script is stopped (e.g., with Ctrl+C).
# It ensures all background Go processes are terminated.
cleanup() {
    echo ""
    echo "--- Shutting down services ---"
    # Kill all background Go processes started by this script
    pkill -f "cmd/user_preference_service"
    pkill -f "cmd/notification_service"
    pkill -f "cmd/sender_service"
    # Kill the Vite dev server
    pkill -f "vite"
    echo "Backend and frontend services stopped."
    # Stop docker containers
    docker compose down
    echo "Docker containers stopped."
    exit
}

# Trap the EXIT signal to run the cleanup function
trap cleanup EXIT

# --- Main Script ---
echo "--- Starting development environment ---"

# 1. Start Docker containers (Postgres, RabbitMQ, Redis) in detached mode
echo "-> Starting Docker containers..."
docker compose up -d
echo "Docker containers started."
echo ""

# Give services a moment to initialize
sleep 5

# 2. Start Backend Go Services in the background
echo "-> Starting Go microservices..."

# User Preference Service
(cd cmd/user_preference_service && go run main.go) &
echo "User Preference Service started on port 8081."

# Notification Service
(cd cmd/notification_service && go run main.go) &
echo "Notification Service started on port 8082."

# Sender Service
(cd cmd/sender_service && go run main.go) &
echo "Sender Service started."
echo ""

# 3. Start Frontend React App in the foreground
echo "-> Starting React frontend (Vite)..."

# Check for and kill any process already running on the frontend port
FRONTEND_PORT=5173
echo "Checking for existing process on port $FRONTEND_PORT..."
# The '-t' flag makes lsof only output the PID
PID=$(lsof -t -i:$FRONTEND_PORT)

if [ -n "$PID" ]; then
    echo "Found existing frontend process on port $FRONTEND_PORT (PID: $PID). Killing it..."
    kill -9 $PID
    sleep 1 # Give a moment for the port to be released
fi

echo "You can stop all services by pressing Ctrl+C in this terminal."
echo ""
(cd frontend && npm run dev)