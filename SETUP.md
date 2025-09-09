# Office Format Grader - Setup Guide

## Initial Setup Process

This guide explains how to set up the Office Format Grader application for the first time.

## Prerequisites

1. Ensure you have [Bun](https://bun.sh) >= 1.2.0 installed
2. Node.js >= 22.0.0
3. Git

## Setup Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd office-format-grader
```

### 2. Install Dependencies

```bash
bun install
```

This will automatically install dependencies for both frontend and backend applications.

### 3. Configure Environment Variables

Copy the example environment files and adjust as needed:

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env

# Frontend
cp apps/frontend/.env.example apps/frontend/.env
```

### 4. Run Initial Setup

The initial setup will create the database and initial users:

```bash
bun run setup:initial
```

This command will:
- Create the SQLite database (if it doesn't exist)
- Run database migrations
- Create initial admin users

### 5. Start Development Servers

```bash
bun run dev
```

This will start both the backend and frontend in development mode.

## Default Users

The initial setup creates the following default users:

1. Admin User
   - Email: `admin@example.com`
   - Password: `admin123`

2. Teacher User
   - Email: `teacher@example.com`
   - Password: `teacher123`

**Important**: Change these default passwords after first login!

## Manual Database Setup (Alternative)

If you prefer to set up the database manually:

```bash
# Navigate to backend directory
cd apps/backend

# Run Prisma migrations
bunx prisma migrate dev --name init

# Return to root directory
cd ../..

# Create initial users
bun run setup:initial
```

## Troubleshooting

### Database Issues

If you encounter database issues:

1. Ensure the `apps/backend/prisma/dev.db` file has proper permissions
2. Try resetting the database:
   ```bash
   cd apps/backend
   rm prisma/dev.db
   bunx prisma migrate dev --name init
   ```

### Dependency Installation Issues

If you encounter issues during dependency installation:

1. Clear Bun cache:
   ```bash
   bun pm cache rm
   ```

2. Reinstall dependencies:
   ```bash
   bun install --force
   ```

### Port Conflicts

By default, the applications use:
- Backend: Port 3001
- Frontend: Port 5173

If these ports are in use, you can change them in the respective `.env` files.

## Production Deployment

For production deployment:

1. Build both applications:
   ```bash
   bun run build
   ```

2. Set production environment variables in both `.env` files

3. Start the applications:
   ```bash
   # Start backend
   bun run start:backend
   
   # Serve frontend build (using a web server like Nginx)
   ```

## Additional Commands

- Run tests: `bun run test`
- Clean build artifacts: `bun run clean`
- Check TypeScript types: `bun run type-check:frontend`
- Lint frontend code: `bun run lint:frontend`