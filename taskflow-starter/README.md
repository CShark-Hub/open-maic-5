# TaskFlow — Starter Repo for Open mAIc #5

This is the **starter version** of the TaskFlow demo — same code, but without AI agent configuration. Your job: add it yourself.

## Quick Start

```bash
git clone <repo-url>
cd taskflow-starter
npm install
npm test                          # Run tests
npm run dev:server                # Backend on :3001
npm run dev:client                # Frontend on :5173 (in a second terminal)
```

## Your Tasks (Hands-on)

### Step 1: Write CLAUDE.md (2 min)

Create a file `CLAUDE.md` in the project root. Describe:
- What this project is (task manager, TypeScript/React/Express)
- How to run it (`npm run dev:server`, `npm test`)
- Project structure (which folders contain what)
- Coding conventions (TypeScript strict, component naming, etc.)

### Step 2: Create a subagent (5 min)

Create the directory first (it doesn't exist yet):

```bash
mkdir -p .claude/agents
```

Then create `.claude/agents/my-reviewer.md` with:

```yaml
---
name: my-reviewer
description: [what this agent does - be specific]
tools: Read, Grep, Glob, Bash
model: sonnet
---

[Your system prompt: what should this agent do when invoked?]
```

Ideas:
- Security reviewer (read-only, finds vulnerabilities)
- Test writer (writes missing tests)
- Code quality checker (finds code smells, naming issues)
- Performance auditor (finds N+1 queries, unnecessary re-renders)

### Step 3: Test it (3 min)

```bash
claude
> Use my-reviewer to review this codebase
```

## Project Structure

```
src/
  server/         - Express backend (routes, middleware, db)
  client/         - React frontend (components, hooks)
  types/          - Shared TypeScript types
tests/            - Test files (Vitest)
```

## Hints

This codebase has intentional issues — security, performance, and frontend bugs. Your agent should find them. There are also missing tests and incomplete features.

Good luck!
