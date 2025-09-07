# Office Vibe - Monorepo

This is a monorepo for the Office Vibe project, containing both the backend and frontend applications.

## Project Structure

```
.
├── apps/
│   ├── backend/     # Bun + Hono backend API
│   └── frontend/    # React + Vite frontend application
├── packages/        # Shared packages (if any)
└── README.md        # This file
```

## Available Scripts

### Root Level Scripts
- `bun run dev` - Run development servers for all apps
- `bun run build` - Build all apps
- `bun run test` - Run tests for all apps
- `bun run clean` - Clean build artifacts

### Backend Specific Scripts
- `bun run dev:backend` - Run backend in development mode
- `bun run build:backend` - Build backend
- `bun run start:backend` - Start built backend
- `bun run test:backend` - Run backend tests

### Frontend Specific Scripts
- `bun run dev:frontend` - Run frontend in development mode
- `bun run build:frontend` - Build frontend
- `bun run preview:frontend` - Preview built frontend
- `bun run test:frontend` - Run frontend tests
- `bun run lint:frontend` - Lint frontend code
- `bun run type-check:frontend` - Type check frontend code

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd apps/backend
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Run database migrations:
   ```bash
   bun run db:migrate
   ```

5. Start the development server:
   ```bash
   bun run dev
   ```

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd apps/frontend
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the development server:
   ```bash
   bun run dev
   ```

## Development Workflow

To start both frontend and backend in development mode:
```bash
bun run dev
```

This will run both applications concurrently, allowing you to develop the full stack application.