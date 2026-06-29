# Stage 1: Build Next.js frontend as static export
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend serving the static frontend
FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app/backend
COPY backend/pyproject.toml ./
RUN uv sync --no-dev --no-install-project

COPY backend/ ./
COPY catalog.json /app/catalog.json
COPY templates/ /app/templates/

# Copy built frontend into backend/static/
COPY --from=frontend-builder /app/out ./static/

EXPOSE 8000
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
