# TaskFlow — Demo Repo for Open mAIc #5

Demo codebase for comparing Claude Code agent architectures: Single Agent vs Sub-Agents vs Agent Teams.

## Quick Start

```bash
git clone <repo-url>
cd taskflow-complete
npm install
npm run dev:server   # Backend on :3001
npm run dev:client   # Frontend on :5173 (in a second terminal)
npm test             # Run tests
```

## What's Inside

A simple task management app (TypeScript/React/Express) with **intentional issues** for workshop demo:

- **5 security/performance/frontend bugs** for agents to find
- **Incomplete test coverage** for agents to fill
- **Missing feature** (task filtering endpoint) for agents to implement

## Agent Setup (pre-configured)

```
.claude/
  agents/
    security-reviewer.md   — Read-only security auditor (Sonnet)
    test-writer.md         — Test generator (Haiku — cheaper)
    feature-builder.md     — Full-stack implementer (Sonnet)
  settings.json            — Agent teams enabled
CLAUDE.md                  — Project context for Claude Code
```

## Workshop Usage

### Demo 1: Single Agent
```bash
claude
> Review this repo, find bugs, write tests, add task filtering.
```

### Demo 2: Sub-Agents
```bash
claude
> Use security-reviewer to audit src/, test-writer to add tests, and feature-builder to implement filtering.
```

### Demo 3: Agent Teams
```bash
claude
> Create an agent team: security-auditor, test-writer, feature-developer. Security shares findings with feature-developer.
```

## Intentional Bugs (Answer Key)

See `ANSWER_KEY.md` for the full list of planted issues.
