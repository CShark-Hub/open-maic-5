import React, { useState } from "react";
import { Task } from "../../types";
import { useTasks } from "../hooks/useTasks";

export function TaskList() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const filters: Record<string, string> = {};
  if (statusFilter !== "all") filters.status = statusFilter;
  if (priorityFilter !== "all") filters.priority = priorityFilter;

  const { tasks, loading } = useTasks(filters);

  // BUG: Mutates state array directly instead of creating new reference
  const handleSelectTask = (taskId: string) => {
    const current = selectedTasks;
    const index = current.indexOf(taskId);
    if (index > -1) {
      current.splice(index, 1); // Direct mutation!
    } else {
      current.push(taskId); // Direct mutation!
    }
    setSelectedTasks(current); // React won't re-render — same reference
  };

  // BUG: Mutates task object directly
  const handleToggleStatus = (task: Task) => {
    const nextStatus =
      task.status === "todo"
        ? "in-progress"
        : task.status === "in-progress"
          ? "done"
          : "todo";
    task.status = nextStatus; // Direct mutation of prop!
    // No API call to persist the change
  };

  const handleBulkDelete = async () => {
    // BUG: No confirmation dialog for destructive action
    for (const taskId of selectedTasks) {
      await fetch(`http://localhost:3001/api/tasks/${taskId}`, {
        method: "DELETE",
      });
    }
    // BUG: Doesn't clear selection or refetch tasks after delete
  };

  if (loading) return <div className="loading">Loading tasks...</div>;

  return (
    <div className="task-list">
      <div className="filters">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {selectedTasks.length > 0 && (
          <button className="danger" onClick={handleBulkDelete}>
            Delete selected ({selectedTasks.length})
          </button>
        )}
      </div>

      <div className="task-grid">
        {/* BUG: Missing key prop in .map() */}
        {tasks.map((task) => (
          <div className={`task-card priority-${task.priority}`}>
            <div className="task-header">
              <input
                type="checkbox"
                checked={selectedTasks.includes(task.id)}
                onChange={() => handleSelectTask(task.id)}
              />
              <h3>{task.title}</h3>
            </div>
            {/* BUG: description rendered as innerHTML — XSS if description contains <script> */}
            <p dangerouslySetInnerHTML={{ __html: task.description }} />
            <div className="task-meta">
              <span className={`status ${task.status}`}>{task.status}</span>
              <span className={`priority ${task.priority}`}>
                {task.priority}
              </span>
              {task.assignee && (
                <span className="assignee">{task.assignee}</span>
              )}
            </div>
            <div className="task-actions">
              <button onClick={() => handleToggleStatus(task)}>
                Toggle status
              </button>
            </div>
          </div>
        ))}
      </div>

      {tasks.length === 0 && <p className="empty">No tasks found</p>}
    </div>
  );
}
