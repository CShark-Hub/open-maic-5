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
