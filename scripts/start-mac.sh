#!/bin/bash
set -e
docker compose up -d --build
echo "App running at http://localhost:8000"
