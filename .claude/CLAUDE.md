# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory. The user will use AI chat in order to establish what document they want and how to fill in the fields. The available documents are covered by the `catalog.json` file in the project root, included here:

`catalog.json`

The current implementation (PL-4) is a Dockerised full-stack app with a FastAPI backend, SQLite database, and statically-built Next.js frontend. It supports the Mutual NDA document with a fake login screen (no real auth). AI chat is not yet implemented.

## Development process

When instructed to build a feature:

1. Use your Atlassian tools to read the feature instructions from Jira.
2. Develop the feature - do not skip any step from the feature-dev 7 step process.
3. Thoroughly test the feature with unit tests and integration tests and fix any issues.
4. Submit a PR using your github tools.

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.  

There is an OPENROUTER_API_KEY in the .env file in the project root.


## Technical design

The entire project is packaged into a Docker container (multi-stage build: Node 20 Alpine builds the frontend, Python 3.12-slim runs the backend).

The backend is in `backend/` — a uv project using FastAPI. It serves the statically-built Next.js frontend via `StaticFiles(html=True)` and initialises a fresh SQLite database (`data/prelegal.db`, users table) on each container start-up.

The frontend is in `frontend/` — Next.js with App Router, Tailwind v4, `output: "export"` and `trailingSlash: true` for static export. The built files land in `frontend/out/` and are copied into `backend/static/` inside the Docker image.

Start/stop scripts are in `scripts/`:

```text
# Mac
scripts/start-mac.sh      # Start
scripts/stop-mac.sh       # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```

The app runs on port 8000. `http://localhost:8000/login/` is the login page (fake — no auth, redirects to `/`). `http://localhost:8000/` is the platform.

## Color Scheme

- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`