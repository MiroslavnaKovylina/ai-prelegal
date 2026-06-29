#!/bin/bash
set -e
if [ ! -f .env ]; then
  echo "Error: .env file not found. Create it with OPENROUTER_API_KEY=<your-key>"
  exit 1
fi
docker compose up -d --build
echo "App running at http://localhost:8000"
