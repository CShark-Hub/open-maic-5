# Open mAIc #5 — Agent Architectures

Materials from **Open mAIc #5: Single Agent vs Sub-Agents vs Agent Teams** — a 90-minute workshop comparing three Claude Code agent architectures on the same task. This repo is published so anyone can rerun the exercises themselves.

> **Theme:** "Same problem, three solutions. Which one to pick?"

The original session ran the same engineering task — find bugs, write tests, add a feature — through three different agent setups, then compared them on time, tokens, and quality.

## Repository Layout

```
.
├── README.md                  # this file
├── LICENSE                    # MIT
├── CLAUDE.md                  # project instructions reference
│
├── .claude/                   # subagent templates used in the demo
│   ├── agents/
│   │   ├── security-reviewer.md
│   │   ├── test-writer.md
│   │   └── feature-builder.md
│   └── settings.json
│
├── taskflow-complete/         # 🟢 reference solution — fully wired up
│   ├── .claude/               # 3 pre-configured subagents
│   ├── CLAUDE.md
│   ├── ANSWER_KEY.md          # spoiler: full bug list
│   └── src/, tests/, …        # TaskFlow app with planted bugs
│
└── taskflow-starter/          # 🟡 try-it-yourself — bare app, build the agent setup
    └── src/, tests/, …        # same code, no .claude/, no CLAUDE.md
```

## The Two Repos

| | `taskflow-complete` | `taskflow-starter` |
|---|---|---|
| Purpose | Reference solution to compare against | Hands-on exercise — build it yourself |
| TaskFlow source code | ✅ identical | ✅ identical |
| `.claude/agents/` | ✅ 3 subagents pre-built | ❌ you build them |
| `CLAUDE.md` | ✅ filled in | ❌ you write it |
| Agent teams flag | ✅ enabled | ❌ you enable it |
| `ANSWER_KEY.md` | ✅ included | ❌ would spoil the exercise |

Both repos are fully runnable: Express backend on `:3001`, React/Vite frontend on `:5173`.

## Quick Start

### Run the reference solution
```bash
cd taskflow-complete
npm install
npm run dev:server   # Terminal 1 — Express on :3001
npm run dev:client   # Terminal 2 — Vite on :5173
claude               # Terminal 3 — Claude Code
```

### Try the exercise yourself
```bash
cd taskflow-starter
npm install
npm run dev:server
npm run dev:client
# Then follow taskflow-starter/README.md to build your CLAUDE.md and a subagent
```

## How the Original Session Was Structured

Reuse the shape if you want to run a session of your own.

| Sec | Topic | Time |
|---|---|---|
| 01 | Intro & series context | 5 min |
| 02 | Theory: 3 architectures | 15 min |
| 03 | **Demo 1** — Single Agent on `taskflow-complete` | 10 min |
| 04 | **Demo 2** — Sub-Agents on `taskflow-complete` | 15 min |
| 05 | **Demo 3** — Agent Teams (tmux) on `taskflow-complete` | 15 min |
| 06 | Compare results | 5 min |
| 07 | Apply to your projects | 10 min |
| 08 | **Hands-on** — build setup on `taskflow-starter` | 10 min |
| 09 | Q&A + wrap-up | 5 min |

## TaskFlow App (the demo target)

A simple task manager (TypeScript / React 19 / Express 4) with **14 intentionally planted issues** across security, performance, and frontend code. The agents' job is to find them, write missing tests, and implement a missing filtering feature.

- **Backend:** `src/server/` — Express REST API + in-memory store
- **Frontend:** `src/client/` — React 19 + Vite
- **Shared types:** `src/types/index.ts`
- **Tests:** `tests/` (Vitest, intentionally incomplete)

See [`taskflow-complete/ANSWER_KEY.md`](taskflow-complete/ANSWER_KEY.md) for the full bug list (spoiler — try the exercise first).

## Requirements

- Node.js 18+
- Anthropic API key (`ANTHROPIC_API_KEY`) configured for Claude Code
- Claude Code CLI installed
- For the agent-teams demo: `tmux` and `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

## Workshop Series

#1 Local AI → #2 Prompt Engineering → #3 Spec Kit → #4 Skills → **#5 Agent Architectures** (this one)

## License

MIT — see [`LICENSE`](LICENSE).
