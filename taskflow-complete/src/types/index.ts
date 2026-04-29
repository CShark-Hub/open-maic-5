export interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  assignee?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  assignee?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: "todo" | "in-progress" | "done";
  priority?: "low" | "medium" | "high";
  assignee?: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  assignee?: string;
}

export interface TaskFilterQuery {
  status?: "todo" | "in-progress" | "done";
  search?: string;
  dueBefore?: string;
  dueAfter?: string;
}

/** JWT payload shape attached to req.user after authenticateToken runs. */
export interface AuthUser {
  sub: string;
  role: string;
  iat: number;
  exp: number;
}

/** Augment Express so req.user is typed without casting everywhere. */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
