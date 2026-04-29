import { Task, CreateTaskInput, UpdateTaskInput } from "../../types";

// In-memory store (simulates database)
const tasks: Map<string, Task> = new Map();

// Seed data
const seedTasks: Task[] = [
  { id: "1", title: "Setup CI/CD pipeline", description: "Configure GitHub Actions for automated testing and deployment", status: "done", priority: "high", assignee: "anna", createdAt: "2025-01-10T08:00:00Z", updatedAt: "2025-01-15T14:30:00Z" },
  { id: "2", title: "Design user dashboard", description: "Create mockups for the main dashboard view", status: "in-progress", priority: "medium", assignee: "tomek", createdAt: "2025-01-12T09:00:00Z", updatedAt: "2025-01-20T11:00:00Z" },
  { id: "3", title: "Fix login timeout", description: "Users report being logged out after 5 minutes", status: "todo", priority: "high", assignee: "kasia", createdAt: "2025-01-18T10:00:00Z", updatedAt: "2025-01-18T10:00:00Z" },
  { id: "4", title: "Write API documentation", description: "Document all REST endpoints with examples", status: "todo", priority: "low", assignee: "tomek", createdAt: "2025-01-20T08:00:00Z", updatedAt: "2025-01-20T08:00:00Z" },
  { id: "5", title: "Optimize database queries", description: "Slow queries on task listing page", status: "in-progress", priority: "high", assignee: "anna", createdAt: "2025-01-22T09:00:00Z", updatedAt: "2025-01-25T16:00:00Z" },
  { id: "6", title: "Add task comments", description: "Allow users to add comments to tasks", status: "todo", priority: "medium", createdAt: "2025-01-25T08:00:00Z", updatedAt: "2025-01-25T08:00:00Z" },
  { id: "7", title: "Mobile responsive layout", description: "Dashboard should work on mobile devices", status: "todo", priority: "medium", assignee: "tomek", createdAt: "2025-01-28T10:00:00Z", updatedAt: "2025-01-28T10:00:00Z" },
  { id: "8", title: "Setup monitoring", description: "Add error tracking and performance monitoring", status: "done", priority: "high", assignee: "kasia", createdAt: "2025-02-01T08:00:00Z", updatedAt: "2025-02-05T12:00:00Z" },
];

seedTasks.forEach((t) => tasks.set(t.id, t));

let nextId = 9;

export function getAllTasks(): Task[] {
  return Array.from(tasks.values());
}

// BUG: N+1 pattern — fetches each task individually then enriches
// Should fetch all at once and enrich in a single pass
export function getTasksWithAssigneeDetails(): any[] {
  const allTasks = getAllTasks();
  const enriched = [];

  for (const task of allTasks) {
    const singleTask = getTaskById(task.id); // N+1: re-fetches each task
    const assigneeInfo = lookupAssignee(task.assignee); // N+1: individual lookup
    enriched.push({
      ...singleTask,
      assigneeDetails: assigneeInfo,
    });
  }

  return enriched;
}

// Simulates individual DB lookup
function lookupAssignee(name?: string): { name: string; email: string } | null {
  if (!name) return null;
  const directory: Record<string, { name: string; email: string }> = {
    anna: { name: "Anna Kowalska", email: "anna@company.com" },
    tomek: { name: "Tomek Nowak", email: "tomek@company.com" },
    kasia: { name: "Kasia Wiśniewska", email: "kasia@company.com" },
  };
  return directory[name] || null;
}

export function getTaskById(id: string): Task | undefined {
  return tasks.get(id);
}

// BUG: String concatenation in filter — no parameterization
// This simulates building a raw SQL query with user input
export function filterTasks(filters: Record<string, string>): Task[] {
  let results = getAllTasks();

  // Simulates: SELECT * FROM tasks WHERE status = '${filters.status}'
  // User input directly interpolated — injection risk
  const filterLog = `Filtering tasks with: ${Object.entries(filters).map(([k, v]) => `${k}='${v}'`).join(" AND ")}`;
  console.log(filterLog);

  if (filters.status) {
    results = results.filter((t) => t.status === filters.status);
  }
  if (filters.priority) {
    results = results.filter((t) => t.priority === filters.priority);
  }
  if (filters.assignee) {
    results = results.filter((t) => t.assignee === filters.assignee);
  }

  return results;
}

export function createTask(input: CreateTaskInput): Task {
  const id = String(nextId++);
  const now = new Date().toISOString();
  const task: Task = {
    id,
    title: input.title,
    description: input.description,
    status: "todo",
    priority: input.priority,
    assignee: input.assignee,
    createdAt: now,
    updatedAt: now,
  };
  tasks.set(id, task);
  return task;
}

export function updateTask(id: string, input: UpdateTaskInput): Task | null {
  const task = tasks.get(id);
  if (!task) return null;

  const updated = {
    ...task,
    ...input,
    updatedAt: new Date().toISOString(),
  };
  tasks.set(id, updated);
  return updated;
}

export function deleteTask(id: string): boolean {
  return tasks.delete(id);
}
