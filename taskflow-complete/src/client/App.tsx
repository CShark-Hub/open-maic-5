import React, { useState } from "react";
import { TaskList } from "./components/TaskList";
import { TaskForm } from "./components/TaskForm";
import { useTaskStats } from "./hooks/useTasks";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// ─── Inner app — rendered only after login ───────────────────────────────

function AppInner() {
  const stats = useTaskStats();
  const { userId, role, token, logout } = useAuth();

  const handleCreateTask = async (task: {
    title: string;
    description: string;
    priority: string;
    assignee: string;
  }) => {
    await fetch("http://localhost:3001/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(task),
    });
    window.location.reload();
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
        <div className="user-info">
          <span>
            {userId} ({role})
          </span>
          <button onClick={logout}>Log out</button>
        </div>
      </header>
      <main>
        <TaskForm onSubmit={handleCreateTask} />
        <TaskList />
      </main>
    </div>
  );
}

// ─── Login screen ─────────────────────────────────────────────────────────

function LoginScreen() {
  const { login } = useAuth();
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<"user" | "admin" | "viewer">("user");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(userId.trim(), role);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <h1>TaskFlow — Sign In</h1>
      <form onSubmit={handleSubmit}>
        <label>
          User ID
          <input
            type="text"
            value={userId}
            maxLength={80}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="e.g. anna"
            required
          />
        </label>
        <label>
          Role
          <select
            value={role}
            onChange={(e) =>
              setRole(e.target.value as "user" | "admin" | "viewer")
            }
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────

function AppRoot() {
  const { token } = useAuth();
  return token ? <AppInner /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoot />
    </AuthProvider>
  );
}
