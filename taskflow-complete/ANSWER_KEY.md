# TaskFlow — Answer Key (Spoiler: full bug list)

> Originally distributed only to the workshop presenter. Now public — read this *after* you've tried finding the bugs yourself, or use it as a checklist.

## Planted Bugs Summary: 14 issues across 5 files

---

### src/server/middleware/auth.ts (4 issues)

1. **CRITICAL** — Hardcoded JWT secret in source code (line 4)
   - `const JWT_SECRET = "taskflow-secret-key-2025-do-not-share"`
   - Fix: use environment variable `process.env.JWT_SECRET`

2. **CRITICAL** — Token decoded without signature verification (line 18)
   - `JSON.parse(Buffer.from(parts[1], "base64").toString())`
   - Fix: use `jose` or `jsonwebtoken` library with proper verify

3. **HIGH** — No token expiry check
   - Expired tokens still work
   - Fix: add `exp` claim and validate it

4. **MEDIUM** — API key comparison vulnerable to timing attack (line 33)
   - `apiKey === "taskflow-demo-api-key-not-real"`
   - Fix: use `crypto.timingSafeEqual()`

---

### src/server/db/tasks.ts (2 issues)

5. **HIGH** — N+1 query pattern in `getTasksWithAssigneeDetails()` (line 36)
   - Re-fetches each task individually + individual assignee lookup
   - Fix: batch fetch all, enrich in single pass

6. **MEDIUM** — User input logged directly in `filterTasks()` (line 61)
   - `console.log(filterLog)` with unsanitized values
   - Fix: sanitize before logging, use structured logging

---

### src/server/routes/tasks.ts (3 issues)

7. **CRITICAL** — No input validation on POST /api/tasks (line 44)
   - Accepts empty title, invalid priority, script tags in description
   - Fix: validate with zod/joi schema

8. **HIGH** — No input validation on query parameters (line 15)
   - Filter values passed directly without sanitization
   - Fix: validate and whitelist allowed filter values

9. **HIGH** — No authorization check on DELETE (line 56)
   - Anyone can delete any task without auth
   - Fix: add `authenticateToken` middleware + ownership check

---

### src/client/components/TaskList.tsx (3 issues)

10. **HIGH** — Missing `key` prop in `.map()` (line 70)
    - `{tasks.map((task) => <div className=...>` — no key
    - Fix: add `key={task.id}`

11. **HIGH** — Direct state mutation in `handleSelectTask()` (lines 24-28)
    - `current.splice()` and `current.push()` mutate array
    - Fix: create new array with spread/filter

12. **CRITICAL** — XSS via `dangerouslySetInnerHTML` (line 79)
    - `<p dangerouslySetInnerHTML={{ __html: task.description }} />`
    - Fix: render as plain text or sanitize with DOMPurify

---

### src/client/hooks/useTasks.ts (2 issues)

13. **HIGH** — No abort controller / cleanup on unmount (line 12)
    - Fetch continues after component unmounts — memory leak
    - Fix: AbortController in useEffect cleanup

14. **MEDIUM** — `JSON.stringify(filters)` in dependency array (line 22)
    - Creates new string every render, triggers unnecessary refetches
    - Fix: use `useMemo` for filters object or individual deps

---

## Missing Test Coverage

Current: 2 basic tests (getAllTasks, createTask)

Missing:
- getTaskById / updateTask / deleteTask
- filterTasks with various combinations
- filterTasks with malicious input
- getTasksWithAssigneeDetails
- Auth middleware (valid/invalid/expired/missing token)
- API routes integration tests
- Edge cases: empty title, invalid priority, non-existent ID

---

## Missing Feature

**Task filtering endpoint** — GET /api/tasks?status=done already partially works but:
- No validation of status/priority values (accepts garbage)
- No combined filter support documentation
- No frontend filter integration with URL params
- No tests for filter combinations
