#!/bin/sh
set -e

echo "Running database migrations..."
if [ -z "$DATABASE_URL" ]; then
    echo "DATABASE_URL is not set. Exiting..."
    exit 1
fi

# Run the golang-migrate binary
migrate -path /app/migrations -database "$DATABASE_URL" up

echo "Migrations initialized successfully. Starting backend..."
# Replace the shell process with the Go binary
exec ./main
