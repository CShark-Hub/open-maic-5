import React from "react";
import { TaskList } from "./components/TaskList";
import { TaskForm } from "./components/TaskForm";
import { useTaskStats } from "./hooks/useTasks";

export default function App() {
  const stats = useTaskStats();

  const handleCreateTask = async (task: {
    title: string;
    description: string;
    priority: string;
    assignee: string;
  }) => {
    await fetch("http://localhost:3001/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    window.location.reload(); // crude refresh
  };

  return (
    <div className="app">
      <header>
        <h1>TaskFlow</h1>
        {stats && (
          <div className="stats">
            <span>Total: {stats.total}</span>
            <span>To Do: {stats.byStatus.todo}</span>
            <span>In Progress: {stats.byStatus["in-progress"]}</span>
            <span>Done: {stats.byStatus.done}</span>
          </div>
        )}
      </header>
      <main>
        <TaskForm onSubmit={handleCreateTask} />
        <TaskList />
      </main>
    </div>
  );
}
