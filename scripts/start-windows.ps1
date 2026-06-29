if (-not (Test-Path .env)) {
  Write-Error ".env file not found. Create it with OPENROUTER_API_KEY=<your-key>"
  exit 1
}
docker compose up -d --build
Write-Host "App running at http://localhost:8000"
