# Open mAIc #5 — Agent Architectures

Workshop materials for **Open mAIc #5: Single Agent vs Sub-Agents vs Agent Teams** — a 90-minute internal workshop comparing three Claude Code agent architectures on the same task.

> **Theme:** "Same problem, three solutions. Which one to pick?"

The workshop runs the same engineering task — find bugs, write tests, add a feature — through three different agent setups, then compares them on time, tokens, and quality.

## Repository Layout

```
.
├── README.md                            # this file
├── OpenMaic_05_AgentArchitectures_Agenda.md   # full 90-min agenda (PL)
├── OpenMaic_05_AgentArchitectures.pdf         # slide deck
├── OpenMaic_05_AgentArchitectures.pptx        # editable slides
├── metrics_template.md                  # live-demo metrics tracker
├── ANSWER_KEY.md                        # planted bugs cheat sheet (presenter only)
├── CLAUDE.md                            # project instructions reference
├── security-reviewer.md                 # subagent template (security audit)
├── test-writer.md                       # subagent template (test generation)
├── feature-builder.md                   # subagent template (feature implementation)
│
├── taskflow-complete/                   # 🟢 Full demo repo — for the presenter
│   ├── .claude/
│   │   ├── agents/                      # 3 pre-configured subagents
│   │   └── settings.json                # agent teams flag enabled
│   ├── CLAUDE.md
│   ├── ANSWER_KEY.md
│   └── src/, tests/, …                  # TaskFlow app with planted bugs
│
└── taskflow-starter/                    # 🟡 Empty starter — for participants
    └── src/, tests/, …                  # same code, no .claude/, no CLAUDE.md
```

## The Two Repos

| | `taskflow-complete` | `taskflow-starter` |
|---|---|---|
| Purpose | Presenter live demos (Sec 03–05) | Participant hands-on (Sec 08) |
| TaskFlow source code | ✅ identical | ✅ identical |
| `.claude/agents/` | ✅ 3 subagents pre-built | ❌ participants build |
| `CLAUDE.md` | ✅ filled in | ❌ participants write |
| Agent teams flag | ✅ enabled | ❌ participants enable |
| `ANSWER_KEY.md` | ✅ included | ❌ would spoil hands-on |

Both repos are fully runnable: Express backend on `:3001`, React/Vite frontend on `:5173`.

## Quick Start

### Presenter (live demo)
```bash
cd taskflow-complete
npm install
npm run dev:server   # Terminal 1 — Express on :3001
npm run dev:client   # Terminal 2 — Vite on :5173
claude               # Terminal 3 — Claude Code
```

### Participant (hands-on)
```bash
cd taskflow-starter
npm install
npm run dev:server
npm run dev:client
# Then follow taskflow-starter/README.md to build your CLAUDE.md and a subagent
```

## Workshop Flow (90 min)

| Sec | Topic | Time |
|---|---|---|
| 01 | Intro & series context | 5 min |
| 02 | Theory: 3 architectures | 15 min |
| 03 | **Demo 1** — Single Agent on `taskflow-complete` | 10 min |
| 04 | **Demo 2** — Sub-Agents on `taskflow-complete` | 15 min |
| 05 | **Demo 3** — Agent Teams (tmux) on `taskflow-complete` | 15 min |
| 06 | Compare results | 5 min |
| 07 | Our projects | 10 min |
| 08 | **Hands-on** — build setup on `taskflow-starter` | 10 min |
| 09 | Q&A + wrap-up | 5 min |

Full agenda with prompts and talking points: [`OpenMaic_05_AgentArchitectures_Agenda.md`](OpenMaic_05_AgentArchitectures_Agenda.md)

## TaskFlow App (the demo target)

A simple task manager (TypeScript / React 19 / Express 4) with **14 intentionally planted issues** across security, performance, and frontend code. The agents' job is to find them, write missing tests, and implement a missing filtering feature.

- **Backend:** `src/server/` — Express REST API + in-memory store
- **Frontend:** `src/client/` — React 19 + Vite
- **Shared types:** `src/types/index.ts`
- **Tests:** `tests/` (Vitest, intentionally incomplete)

See [`taskflow-complete/ANSWER_KEY.md`](taskflow-complete/ANSWER_KEY.md) for the full bug list (presenters only).

## Requirements

- Node.js 18+
- Anthropic API key (`ANTHROPIC_API_KEY`) configured for Claude Code
- Claude Code CLI installed
- For agent teams demo: `tmux` and `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

## Workshop Series

#1 Local AI → #2 Prompt Engineering → #3 Spec Kit → #4 Skills → **#5 Agent Architectures** (this one)
