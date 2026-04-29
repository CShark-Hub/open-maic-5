# TaskFlow — Project Instructions

## Overview
TaskFlow is a simple task management application (TypeScript/React/Express) used as a demo codebase for testing different Claude Code agent architectures.

## Stack
- **Backend**: Express.js + TypeScript (src/server/)
- **Frontend**: React 19 + TypeScript (src/client/)
- **Database**: In-memory Map (simulates DB, see src/server/db/tasks.ts)
- **Tests**: Vitest (tests/)
- **Build**: Vite (frontend), ts-node (backend)

## How to run
```bash
npm install
npm run dev:server   # Backend on :3001
npm run dev:client   # Frontend on :5173
npm test             # Run tests
```

## Project structure
- src/server/index.ts — Express entry point
- src/server/routes/tasks.ts — REST API routes
- src/server/middleware/auth.ts — Authentication middleware
- src/server/db/tasks.ts — Data layer (in-memory)
- src/client/App.tsx — React root
- src/client/components/ — UI components
- src/client/hooks/ — React hooks
- src/types/index.ts — Shared TypeScript types
- tests/ — Test files

## Conventions
- TypeScript strict mode
- Components: PascalCase.tsx
- Hooks: use[Name].ts
- Tests next to code or in tests/
- No console.log in production (use proper logging)

## Known areas to investigate
This codebase has intentional issues for workshop purposes:
- Security: authentication, input validation, XSS
- Performance: query patterns
- Frontend: React state management, cleanup
- Tests: coverage is incomplete
