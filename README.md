![Application Screenshot](./docs/images/app.png)

# PreLegal

A production-quality SaaS application for drafting legal agreements through AI-assisted conversation.

---

## What the Application Is

PreLegal is a full-stack web platform that allows users to create professional legal documents through a guided AI chat interface. Instead of manually filling in complex legal templates, users describe their needs in plain language and the AI collects the required information, fills in the document fields in real time, and produces a print-ready PDF.

**Who it is for:** Founders, operators, and small legal teams who need to produce standard commercial agreements quickly and accurately, without drafting from scratch.

**Key features:**

- **AI-assisted document drafting** — conversational chat interface guides the user through every required field, one topic at a time
- **Live document preview** — the agreement updates in real time as fields are collected; unfilled placeholders are highlighted and disappear cleanly in the final PDF
- **12 document types** — Mutual NDA, Cloud Service Agreement, Data Processing Agreement, Business Associate Agreement, SLA, PSA, Software License, Partnership Agreement, Pilot Agreement, Design Partner Agreement, AI Addendum, and more
- **User accounts and document history** — users register, sign in, and retrieve previously created documents to continue editing where they left off
- **Draft disclaimer** — every document carries a visible legal disclaimer that it is AI-generated and requires professional review before use
- **PDF export** — one-click browser print-to-PDF with a clean, formatted output

**Technology stack:**

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router, static export), React, TypeScript, Tailwind CSS v4 |
| Backend | Python 3.12, FastAPI, SQLite |
| AI | LiteLLM → OpenRouter → GPT-o1 via Cerebras inference |
| Auth | PBKDF2-HMAC-SHA256 password hashing, PyJWT Bearer tokens |
| Infrastructure | Docker (multi-stage build), `uv` Python package manager |

**Why it represents a real-world AI application:**

PreLegal demonstrates a complete, production-viable architecture for AI-powered document generation: structured outputs from a language model are used to reliably extract typed field values, which are then bound to a live document template with zero hallucination risk on the rendered output. The AI converses naturally while the backend enforces correctness through typed Pydantic schemas and span-based template substitution.

---

## Development Process

PreLegal was built following a professional feature-driven development workflow, with each increment planned, implemented, tested, reviewed, and merged before the next began.

**Tooling and workflow:**

- **Claude Code** was used as the primary development environment — writing, refactoring, debugging, and testing code end to end
- Work was organised as **Jira tickets** (PL-1 through PL-7), each defining a discrete, deliverable feature increment
- Each ticket was implemented on its **own GitHub feature branch**, keeping changes isolated and reviewable
- Every branch included **unit and integration tests** (Jest for the frontend, Python API tests for the backend) that passed before submission
- Completed branches were submitted as **GitHub Pull Requests**, reviewed, and squash-merged into `main`
- The `main` branch always represents a working, deployable state of the application

**Feature increments delivered:**

| Ticket | Deliverable |
|---|---|
| PL-1 | Project scaffolding and repository setup |
| PL-2 | Legal template library (12 document types in Markdown) |
| PL-3 | Mutual NDA creator UI with live preview and PDF export |
| PL-4 | Dockerised full-stack foundation (FastAPI backend, static Next.js frontend) |
| PL-5 | AI chat integration with structured field extraction |
| PL-6 | Multi-document support across all 12 document types |
| PL-7 | User authentication, per-user document history, UI polish, draft disclaimer |

This workflow — ticket → branch → test → PR → merge — mirrors the engineering practices of a professional software team and produces a codebase that is maintainable, auditable, and ready for further development.
