import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  getAllTasks,
  getTaskById,
  getTasksWithAssigneeDetails,
  filterTasks,
  filterTasksAdvanced,
  createTask,
  updateTask,
  deleteTask,
} from "../db/tasks";
import { authenticateToken } from "../middleware/auth";
import { TaskFilterQuery } from "../../types";

const router = Router();

// ─── Zod validation schemas ────────────────────────────────────────────────

const createTaskSchema = z.object({
  title: z
    .string({ required_error: "title is required" })
    .min(1, "title must not be empty")
    .max(200, "title must be ≤200 characters"),
  description: z.string().max(2000, "description must be ≤2000 characters").default(""),
  priority: z.enum(["high", "medium", "low"], {
    errorMap: () => ({ message: "priority must be high, medium, or low" }),
  }),
  assignee: z
    .string()
    .max(80, "assignee must be ≤80 characters")
    .optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(["todo", "in-progress", "done"]).optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  assignee: z.string().max(80).optional(),
});

// ─── Ownership helper ─────────────────────────────────────────────────────

/**
 * Returns true if the requesting user owns the task or is an admin.
 * Unassigned tasks are accessible by any authenticated user.
 */
function canModifyTask(
  userSub: string,
  userRole: string,
  taskAssignee?: string
): boolean {
  return userRole === "admin" || !taskAssignee || taskAssignee === userSub;
}

// ─── Routes ───────────────────────────────────────────────────────────────

// Fix #8: GET / now requires a valid token.
router.get("/", authenticateToken, (req: Request, res: Response) => {
  const { status, priority, assignee, enriched } = req.query;

  if (enriched === "true") {
    const tasks = getTasksWithAssigneeDetails();
    return res.json({ data: tasks });
  }

  if (status || priority || assignee) {
    const filters: Record<string, string> = {};
    if (status) filters.status = status as string;
    if (priority) filters.priority = priority as string;
    if (assignee) filters.assignee = assignee as string;

    const tasks = filterTasks(filters);
    return res.json({ data: tasks });
  }

  const tasks = getAllTasks();
  return res.json({ data: tasks });
});

// GET /api/tasks/filter — validated filtered search (protected)
const VALID_STATUSES = ["todo", "in-progress", "done"] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

router.get("/filter", authenticateToken, (req: Request, res: Response) => {
  const { status, search } = req.query;

  if (
    status !== undefined &&
    (typeof status !== "string" || !VALID_STATUSES.includes(status as ValidStatus))
  ) {
    return res
      .status(400)
      .json({ error: "Invalid status value. Must be one of: todo, in-progress, done" });
  }

  if (search !== undefined && typeof search !== "string") {
    return res.status(400).json({ error: "Invalid search parameter" });
  }
  if (search !== undefined && search.length > 200) {
    return res
      .status(400)
      .json({ error: "Search term too long (max 200 characters)" });
  }

  const query: TaskFilterQuery = {};
  if (status) query.status = status as TaskFilterQuery["status"];
  if (search && search.trim().length > 0) query.search = search.trim();

  const tasks = filterTasksAdvanced(query);
  return res.json({ data: tasks });
});

// GET /api/tasks/:id — get single task (public — no sensitive data exposure risk)
router.get("/:id", (req: Request, res: Response) => {
  const task = getTaskById(req.params.id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  return res.json({ data: task });
});

// Fix #8 + #9: POST / requires auth and Zod-validated body.
router.post("/", authenticateToken, (req: Request, res: Response) => {
  const result = createTaskSchema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.issues.map((e) => e.message).join(", ");
    return res.status(400).json({ error: messages });
  }

  const { title, description, priority, assignee } = result.data;
  const task = createTask({ title, description, priority, assignee });
  return res.status(201).json({ data: task });
});

// Fix #8 + #9: PUT /:id requires auth, validates body, and checks ownership.
router.put("/:id", authenticateToken, (req: Request, res: Response) => {
  const result = updateTaskSchema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.issues.map((e) => e.message).join(", ");
    return res.status(400).json({ error: messages });
  }

  const existing = getTaskById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: "Task not found" });
  }

  const { sub, role } = req.user!;
  if (!canModifyTask(sub, role, existing.assignee)) {
    return res.status(403).json({ error: "Forbidden: you do not own this task" });
  }

  const task = updateTask(req.params.id, result.data);
  return res.json({ data: task });
});

// Fix #4: DELETE /:id now requires auth and an ownership/admin check.
router.delete("/:id", authenticateToken, (req: Request, res: Response) => {
  const task = getTaskById(req.params.id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  const { sub, role } = req.user!;
  if (!canModifyTask(sub, role, task.assignee)) {
    return res.status(403).json({ error: "Forbidden: you do not own this task" });
  }

  deleteTask(req.params.id);
  return res.json({ data: { deleted: true } });
});

// GET /api/tasks/stats/summary — public stats endpoint
router.get("/stats/summary", (_req: Request, res: Response) => {
  const tasks = getAllTasks();
  const stats = {
    total: tasks.length,
    byStatus: {
      todo: tasks.filter((t) => t.status === "todo").length,
      "in-progress": tasks.filter((t) => t.status === "in-progress").length,
      done: tasks.filter((t) => t.status === "done").length,
    },
    byPriority: {
      high: tasks.filter((t) => t.priority === "high").length,
      medium: tasks.filter((t) => t.priority === "medium").length,
      low: tasks.filter((t) => t.priority === "low").length,
    },
  };
  return res.json({ data: stats });
});

export default router;
