# Walkthrough — Self-Guided

A step-by-step guide to running the Open mAIc #5 exercises on your own. About **60–90 minutes** end-to-end if you do all three architectures plus the hands-on.

> **The shape of the session:** Demo the same engineering task — *find bugs, write tests, add a feature* — through three different agent architectures, compare the results, then build your own setup from scratch.

---

## 0 · Prerequisites

- **Node.js 18+**
- **Claude Code CLI** installed and authenticated ([install guide](https://docs.claude.com/en/docs/claude-code))
- **`ANTHROPIC_API_KEY`** set, or a Claude subscription
- **`tmux`** *(only for Architecture 3 — Agent Teams)*

```bash
git clone <this-repo>
cd open-maic-5
```

---

## 1 · Setup (5 min)

Install both projects:

```bash
cd taskflow-complete && npm install && cd ..
cd taskflow-starter  && npm install && cd ..
```

Start the **reference solution** running so you can see what the agents are working on:

```bash
cd taskflow-complete
npm run dev:server   # Terminal 1 — Express on :3001
npm run dev:client   # Terminal 2 — Vite on :5173
```

Visit **http://localhost:5173** — you should see the TaskFlow UI with seed tasks. Leave both servers running for the rest of Part 2.

> **Heads-up:** TaskFlow has **14 intentionally planted issues** (security, performance, frontend) plus incomplete tests and a missing filtering feature. The agents' job is to find and fix them. Full list in [`taskflow-complete/ANSWER_KEY.md`](taskflow-complete/ANSWER_KEY.md) — open *after* you've tried a run.

---

## 2 · Architecture 1: Single Agent (~10 min)

**Mental model:** one agent, one context window, everything in sequence. The simplest setup. The agent decides for itself how to break work down.

### Run it

```bash
cd taskflow-complete
claude
```

In the Claude Code prompt, paste:

```
Audit this repo end to end. Specifically:

1. Find security issues in src/server/ (auth, validation, injection).
2. Find React/frontend issues in src/client/ (XSS, state, cleanup).
3. Find performance issues (query patterns, unnecessary re-renders).
4. Identify missing test coverage and add the most important tests.
5. The /api/tasks?status=… filter endpoint is incomplete — finish it
   (validation + tests + docs).

Report findings as you go. Run `npm test` to verify.
```

### What to watch for

- One linear stream of reasoning — easy to follow, easy to redirect mid-task.
- Context fills up as the agent reads files, then results, then writes code. On a task this size you may hit auto-compaction.
- The agent picks its own order. Often: read → audit → fix → test → feature. Sometimes it skips ahead.

### Pros & cons

| ✅ | ❌ |
|---|---|
| Easiest to set up (zero config) | Long tasks burn context; quality drops near limit |
| Easy to course-correct in real time | One generalist mindset for very different sub-tasks |
| Single conversation — one transcript | Hard to parallelize independent work |

---

## 3 · Architecture 2: Sub-Agents (~15 min)

**Mental model:** an orchestrator agent delegates to **specialists**, each invoked in a fresh context with its own system prompt and tool allowlist. Specialists return summaries — the orchestrator stitches them together.

### What's pre-configured

This repo ships three subagents in `taskflow-complete/.claude/agents/`:

| Subagent | Role | Tools | Model |
|---|---|---|---|
| `security-reviewer` | Read-only auditor; reports CRITICAL/HIGH/MEDIUM/LOW issues with file:line | `Read, Grep, Glob, Bash` | sonnet |
| `test-writer`       | Writes Vitest tests in the existing style | `Read, Write, Edit, Grep, Glob, Bash` | haiku |
| `feature-builder`   | Implements features end-to-end (types → DB → routes → UI → tests) | `Read, Write, Edit, Grep, Glob, Bash` | sonnet |

Open one of those files to see how a subagent is defined: frontmatter (`name`, `description`, `tools`, `model`) plus the system prompt.

### Run it

From `taskflow-complete`:

```
Use these subagents in sequence:

1. security-reviewer — audit src/server/ and src/client/.
   Don't modify anything. Just report findings.
2. test-writer — given the audit results, write tests that catch
   the issues. Then add tests for the existing routes that lack coverage.
3. feature-builder — implement the missing /api/tasks/filter endpoint
   based on the partial work already in src/server/routes/tasks.ts.
   Use Zod for validation. Add tests.

Run `npm test` at the end and summarize results.
```

### What to watch for

- The orchestrator dispatches each subagent in turn. Each one runs in its **own** context window — when it returns, only its summary lands in the orchestrator's context.
- The `security-reviewer` has no `Write`/`Edit` tools — by design. It can only report.
- `test-writer` runs on **Haiku** to keep it cheap; the heavier `feature-builder` runs on Sonnet.
- The orchestrator decides whether to feed the audit findings forward to `test-writer`. You can be explicit about this in the prompt (as above).

### Pros & cons

| ✅ | ❌ |
|---|---|
| Each specialist has focused tools/prompts → better quality | More setup (need to define subagents) |
| Fresh context per subagent → no context contamination | Information loss at handoffs (only summaries return) |
| Mix models — cheap for cheap work, smart for smart work | Orchestrator can still bottleneck if poorly prompted |

---

## 4 · Architecture 3: Agent Teams (~15 min)

**Mental model:** multiple agents running **in parallel** in their own tmux panes, able to send each other messages. Useful when work is genuinely independent or when you want one agent to react to another's output in real time.

> **Status:** experimental flag. Behavior may change.

### Setup

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

(or uncomment the env block in `taskflow-complete/.claude/settings.json`)

You also need `tmux` installed.

### Run it

From `taskflow-complete`:

```bash
claude
```

Then in the prompt:

```
Spin up an agent team in tmux with three members:

- security-auditor: audits src/ for issues. Read-only.
- test-writer: writes Vitest tests for new and existing code.
- feature-developer: implements the /api/tasks/filter endpoint.

Workflow:
1. security-auditor and feature-developer start in parallel.
2. As security-auditor finds issues, it forwards them to feature-developer
   so the new code avoids those patterns.
3. test-writer waits for feature-developer's first commit, then writes
   tests for it AND tests for the issues security-auditor found.

When all three are done, run `npm test` and post a combined report.
```

### What to watch for

- Three tmux panes, three agents. They can `send-message` to each other.
- Real parallelism on independent sub-tasks → wall-clock faster than the sequential sub-agents run.
- More moving parts: harder to follow, easier to deadlock if the protocol isn't clear.

### Pros & cons

| ✅ | ❌ |
|---|---|
| Genuine parallelism for independent work | Coordination overhead — needs a clear protocol |
| Agents can react to each other's intermediate output | Harder to inspect (multiple transcripts) |
| Fits a "team of specialists" mental model | Experimental flag, more failure modes |

---

## 5 · Compare the three runs (~5 min)

Score each run on a few axes:

| Metric | How to measure |
|---|---|
| **Wall-clock time** | Stopwatch — start to "done" |
| **Tokens used** | Look at Claude Code's usage indicator at end of session |
| **Issues found** | Cross-check against [`ANSWER_KEY.md`](taskflow-complete/ANSWER_KEY.md) — out of 14 |
| **Tests added** | `git diff --stat tests/` |
| **Tests passing** | `npm test` exit code |
| **Subjective quality** | Read the diff. Are fixes idiomatic? Over-engineered? |

A rough rule of thumb from running these:

| Architecture | Best when |
|---|---|
| Single Agent | Small tasks (≤30 min), you want to steer in real time |
| Sub-Agents | Medium tasks with distinct phases (audit → write → ship) |
| Agent Teams | Genuinely parallel work, or workflows where one agent reacts live to another |

---

## 6 · Hands-on: build it yourself (`taskflow-starter`, ~10 min)

Now leave `taskflow-complete` alone and switch to the empty starter. Same code, no `.claude/`, no `CLAUDE.md`. You build the agent setup from scratch.

```bash
cd ../taskflow-starter
npm run dev:server     # Terminal 1
npm run dev:client     # Terminal 2
claude                 # Terminal 3
```

### Step 1 — Write `CLAUDE.md` (2 min)

Create `taskflow-starter/CLAUDE.md`. Include:

- **What** the project is (task manager, TS/React/Express).
- **How to run it** (`npm run dev:server`, `npm test`).
- **Project structure** (which folders contain what).
- **Conventions** (TypeScript strict, component naming, where tests live).

Cheat: copy [`taskflow-complete/CLAUDE.md`](taskflow-complete/CLAUDE.md) and edit. But try freehand first — Claude Code reads this file on every invocation, so the cost of a sloppy one is permanent.

### Step 2 — Build a subagent (5 min)

```bash
mkdir -p .claude/agents
```

Create `.claude/agents/my-reviewer.md`:

```yaml
---
name: my-reviewer
description: <one sentence — what does it do, when should it run>
tools: Read, Grep, Glob, Bash
model: sonnet
---

<system prompt — what this agent should do when invoked>
```

Ideas:
- **Security reviewer** — read-only auditor (no `Write`/`Edit`)
- **Test writer** — writes tests in the existing style
- **Performance auditor** — finds N+1, unnecessary re-renders
- **Docstring writer** — adds JSDoc to exported functions

Reference: peek at [`taskflow-complete/.claude/agents/`](taskflow-complete/.claude/agents) — but write yours first to feel the difference.

### Step 3 — Invoke it (3 min)

```bash
claude
> Use my-reviewer to review src/server/ and report findings.
```

Watch what it does. Tweak the system prompt. Re-run.

---

## 7 · Common pitfalls

- **Forgetting `JWT_SECRET`** — the complete server fails fast at boot if `JWT_SECRET` isn't set. Set it before `npm run dev:server`: `export JWT_SECRET=anything-non-empty`.
- **Auto-compaction mid-flow** — long Single-Agent runs may compact and lose context. If quality drops, start a fresh session and ask it to resume from a checkpoint.
- **Subagent over-delegation** — invoking a subagent for trivial work wastes round-trips. Use them for jobs with a *focused tool requirement* or a *fresh-context advantage*.
- **Agent Teams without a protocol** — without a clear "who sends what to whom when", teams deadlock or drift. Always specify the workflow in the kickoff prompt.
- **Trusting the agent's "done"** — ALWAYS run `npm test` and look at the diff yourself. Especially after fix-then-test runs, where the agent may have written tests that pass against its (wrong) fixes.

---

## 8 · After you finish

- Compare your numbers against the rubric in §5.
- Check what you found against [`ANSWER_KEY.md`](taskflow-complete/ANSWER_KEY.md). Anything missed? Why?
- Try one variation: same task, different model (Opus vs Sonnet vs Haiku). Same task, different agent count. Note where the marginal value of more architecture stops paying off.

That's the whole exercise.
