# Office Vibe - Monorepo

A full-stack application for grading office documents (Word, PowerPoint) with automated feedback.

## Project Structure

```
office-format-grader/
├── apps/
│   ├── backend/     # Bun + Hono API server
│   └── frontend/    # React + Vite frontend
├── package.json     # Root package with workspace setup
└── README.md        # This file
```

## Prerequisites

- [Bun](https://bun.sh) >= 1.2.0
- Node.js >= 22.0.0

## Quick Start

1. Install dependencies for both frontend and backend:
```bash
bun install
```

2. Run both frontend and backend in development mode:
```bash
bun run dev
```

## Available Scripts

### Root Scripts
- `bun install` - Install dependencies for both frontend and backend
- `bun run dev` - Start both frontend and backend in development mode
- `bun run build` - Build both frontend and backend for production
- `bun run test` - Run tests for both frontend and backend
- `bun run clean` - Clean build artifacts

### Setup Scripts
- `bun run setup:dependencies` - Install dependencies for both apps
- `bun run setup:initial` - Run initial setup (database migration + create initial users)
- `bun run setup:all` - Run complete setup (dependencies + initial setup)

### Backend Scripts
- `bun run dev:backend` - Start backend in development mode
- `bun run build:backend` - Build backend for production
- `bun run start:backend` - Start backend in production mode
- `bun run test:backend` - Run backend tests

### Frontend Scripts
- `bun run dev:frontend` - Start frontend in development mode
- `bun run build:frontend` - Build frontend for production
- `bun run preview:frontend` - Preview built frontend
- `bun run test:frontend` - Run frontend tests
- `bun run lint:frontend` - Lint frontend code
- `bun run type-check:frontend` - Check TypeScript types in frontend

## Environment Variables

Each app has its own `.env` file:
- `apps/backend/.env` - Backend environment variables
- `apps/frontend/.env` - Frontend environment variables

See `.env.example` files in each app directory for required variables.

## Initial Setup

To set up the application for the first time:

1. Copy `.env.example` to `.env` in both `apps/backend` and `apps/frontend`
2. Run the initial setup script:
```bash
bun run setup:initial
```

This will run both applications concurrently, allowing you to develop the full stack application.