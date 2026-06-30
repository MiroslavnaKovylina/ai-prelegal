# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory. The user interacts via AI chat to fill in document fields, and sees a live document preview that updates as fields are collected. The available documents are defined in `catalog.json` at the project root.

The current implementation (PL-7) is a Dockerised full-stack app with a FastAPI backend, SQLite database, and statically-built Next.js frontend. It supports all 12 document types with full AI chat, live document preview, real user authentication, and per-user document history with continue-editing support.

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

The backend is in `backend/` — a uv project using FastAPI. It serves the statically-built Next.js frontend via `StaticFiles(html=True)` and initialises a fresh SQLite database (`data/prelegal.db`) on each container start-up. The DB is ephemeral — it resets on restart by design. Key tables: `users` (id, email, password_hash), `documents` (id, user_id, document_type, catalog_name, fields JSON, messages JSON, timestamps).

Auth uses PBKDF2-HMAC-SHA256 password hashing (`backend/auth.py`) and PyJWT Bearer tokens. All `/api/chat` and `/api/documents` endpoints require a valid token.

Key API endpoints:

- `POST /api/auth/register` — create account, returns `{ token, email }`
- `POST /api/auth/login` — returns `{ token, email }`
- `GET /api/catalog` — returns the catalog with derived `id` fields
- `GET /api/templates/{filename}` — serves raw template markdown
- `POST /api/chat` — AI chat for a given `document_type`, returns `{ message, fields }` (auth required)
- `GET /api/documents` — list current user's saved documents (auth required)
- `POST /api/documents` — create a document (auth required)
- `PUT /api/documents/{id}` — update fields + messages (auth required)
- `DELETE /api/documents/{id}` — delete a document (auth required)

The Dockerfile runs `.venv/bin/uvicorn` directly (not `uv run`) so the container starts instantly with no PyPI network call.

The frontend is in `frontend/` — Next.js with App Router, Tailwind v4, `output: "export"` and `trailingSlash: true` for static export. The built files land in `frontend/out/` and are copied into `backend/static/` inside the Docker image. Key components:

- `src/app/page.tsx` — auth guard (redirects to `/login/` if no token), landing page with "My Documents" history + catalog grid, split chat+preview view
- `src/app/login/page.tsx` — real sign-in form, calls `/api/auth/login`
- `src/app/register/page.tsx` — sign-up form with password confirmation, calls `/api/auth/register`
- `src/lib/auth.ts` — token helpers: `getToken()`, `getEmail()`, `saveSession()`, `clearSession()`, `authHeaders()` (returns `Authorization: Bearer <token>` header)
- `src/components/ChatPanel.tsx` — AI chat; auto-saves to `/api/documents` after first AI response (creates), then PUTs on every subsequent turn; accepts `initialMessages` to restore history for continue-editing
- `src/components/DocumentRenderer.tsx` — fetches template markdown, runs `substituteFields()` to replace `<span class="*_link">FieldName</span>` placeholders with values or yellow `<mark>` highlights, renders with `react-markdown` + `remark-gfm` + `rehype-raw`; shows draft disclaimer banner
- `src/types/document.ts` — `DocumentData = Record<string, string | undefined>`, `CatalogEntry`

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

The app runs on port 8000. `http://localhost:8000/login/` is the sign-in page. `http://localhost:8000/register/` is the sign-up page. `http://localhost:8000/` is the platform (redirects to login if not authenticated).

## Template system

Templates live in `templates/` as markdown files. Fillable fields use `<span class="coverpage_link">Field Name</span>` or `<span class="keyterms_link">Field Name</span>` (class varies by template section but the pattern is always `*_link`). `DocumentRenderer` scans these spans to build a normalised index, then substitutes matched fields with `<strong>value</strong>` and leaves unmatched spans as yellow `<mark>` highlights. Highlights are hidden in print/PDF via `@media print { mark { display: none } }`.

The `backend/ai.py` module defines:
- `DOCUMENT_FIELD_NAMES` — per-document list of field names that match span text exactly
- `DOCUMENT_REGISTRY` — per-document system prompts
- `_fields_model()` — builds a cached Pydantic model with `Field(alias=name)` per field for structured output
- `get_chat_response()` — calls LiteLLM with the typed model as `response_format`, handles both native JSON-schema and tool-call fallback paths, returns `ChatTurn(message, fields)`

When adding a new document type: (1) add a template with `*_link` spans, (2) add it to `catalog.json`, (3) add a field list and system prompt to `ai.py`.

## Color Scheme

- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`