import React, { useState, useCallback } from "react";
import { Task, TaskFilterQuery } from "../../types";
import { useTasks } from "../hooks/useTasks";
import { useFilteredTasks } from "../hooks/useFilteredTasks";
import { useAuth } from "../contexts/AuthContext";

export function TaskList() {
  const { token } = useAuth();

  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const isSearching = searchTerm.trim().length > 0;

  const basicFilters: Record<string, string> = {};
  if (statusFilter !== "all") basicFilters.status = statusFilter;
  if (priorityFilter !== "all") basicFilters.priority = priorityFilter;

  const filterQuery: TaskFilterQuery = {};
  if (statusFilter !== "all")
    filterQuery.status = statusFilter as TaskFilterQuery["status"];
  if (searchTerm.trim().length > 0) filterQuery.search = searchTerm.trim();

  const { tasks: basicTasks, loading: basicLoading, refetch: refetchBasic } = useTasks(
    isSearching ? undefined : basicFilters,
    token ?? undefined
  );
  const {
    tasks: filteredTasks,
    loading: filteredLoading,
    error: filterError,
    refetch: refetchFiltered,
  } = useFilteredTasks(filterQuery, token ?? "");

  const tasks = isSearching ? filteredTasks : basicTasks;
  const loading = isSearching ? filteredLoading : basicLoading;

  const refetch = isSearching ? refetchFiltered : refetchBasic;

  // Fix: immutable state update — create new array reference.
  const handleSelectTask = useCallback((taskId: string) => {
    setSelectedTasks((prev) => {
      const idx = prev.indexOf(taskId);
      return idx > -1
        ? [...prev.slice(0, idx), ...prev.slice(idx + 1)]
        : [...prev, taskId];
    });
  }, []);

  // Fix: call API to persist status change — no direct mutation.
  const handleToggleStatus = useCallback(
    async (task: Task) => {
      const nextStatus =
        task.status === "todo"
          ? "in-progress"
          : task.status === "in-progress"
            ? "done"
            : "todo";

      await fetch(`http://localhost:3001/api/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      refetch();
    },
    [token, refetch]
  );

  // Fix: require confirmation, send auth token, clear selection, refetch.
  const handleBulkDelete = useCallback(async () => {
    if (selectedTasks.length === 0) return;

    if (!window.confirm(`Delete ${selectedTasks.length} task(s)? This cannot be undone.`)) {
      return;
    }

    await Promise.all(
      selectedTasks.map((taskId) =>
        fetch(`http://localhost:3001/api/tasks/${taskId}`, {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
      )
    );

    setSelectedTasks([]);
    refetch();
  }, [selectedTasks, token, refetch]);

  if (loading) return <div className="loading">Loading tasks...</div>;

  return (
    <div className="task-list">
      <div className="filters">
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          maxLength={200}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

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

      {filterError && <p className="error">Filter error: {filterError}</p>}

      <div className="task-grid">
        {/* Fix: key prop added; Fix #5: description rendered as plain text (no XSS). */}
        {tasks.map((task) => (
          <div key={task.id} className={`task-card priority-${task.priority}`}>
            <div className="task-header">
              <input
                type="checkbox"
                checked={selectedTasks.includes(task.id)}
                onChange={() => handleSelectTask(task.id)}
              />
              <h3>{task.title}</h3>
            </div>
            {/* Fix #5: plain text — no dangerouslySetInnerHTML */}
            <p>{task.description}</p>
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
