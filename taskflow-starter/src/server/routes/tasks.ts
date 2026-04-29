import { Router, Request, Response } from "express";
import {
  getAllTasks,
  getTaskById,
  getTasksWithAssigneeDetails,
  filterTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../db/tasks";

const router = Router();

// GET /api/tasks — list all tasks
// BUG: No input validation on query parameters
// User input goes directly into filter logic
router.get("/", (req: Request, res: Response) => {
  const { status, priority, assignee, enriched } = req.query;

  if (enriched === "true") {
    // Uses N+1 pattern internally
    const tasks = getTasksWithAssigneeDetails();
    return res.json({ data: tasks });
  }

  if (status || priority || assignee) {
    // BUG: Query params passed directly without sanitization
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

// GET /api/tasks/:id — get single task
router.get("/:id", (req: Request, res: Response) => {
  const task = getTaskById(req.params.id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  return res.json({ data: task });
});

// POST /api/tasks — create task
// BUG: No validation on request body — accepts anything
router.post("/", (req: Request, res: Response) => {
  const { title, description, priority, assignee } = req.body;

  // No validation: title could be empty, priority could be "hacked",
  // description could contain <script> tags (XSS)
  const task = createTask({
    title,
    description,
    priority,
    assignee,
  });

  return res.status(201).json({ data: task });
});

// PUT /api/tasks/:id — update task
// BUG: No validation on update fields
router.put("/:id", (req: Request, res: Response) => {
  const task = updateTask(req.params.id, req.body);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  return res.json({ data: task });
});

// DELETE /api/tasks/:id — delete task
// BUG: No authorization check — anyone can delete any task
router.delete("/:id", (req: Request, res: Response) => {
  const success = deleteTask(req.params.id);
  if (!success) {
    return res.status(404).json({ error: "Task not found" });
  }
  return res.json({ data: { deleted: true } });
});

// GET /api/tasks/stats/summary — task statistics
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
