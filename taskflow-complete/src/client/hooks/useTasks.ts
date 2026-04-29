import { useState, useEffect, useRef, useCallback } from "react";
import { Task } from "../../types";

const API_BASE = "http://localhost:3001/api";

interface UseTasksResult {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTasks(
  filters?: Record<string, string>,
  token?: string
): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const filtersKey = JSON.stringify(filters ?? {});
  const prevFiltersKey = useRef<string | null>(null);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    // Skip if nothing changed and this is not a forced refetch (tick unchanged)
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    let url = `${API_BASE}/tasks`;
    if (filters && Object.keys(filters).length > 0) {
      const params = new URLSearchParams(filters);
      url += `?${params.toString()}`;
    }

    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((body: { error?: string }) => {
            throw new Error(body.error ?? `Request failed: ${res.status}`);
          });
        }
        return res.json() as Promise<{ data: Task[] }>;
      })
      .then(({ data }) => {
        setTasks(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setError(err.message);
        setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, token, tick]);

  prevFiltersKey.current = filtersKey;

  return { tasks, loading, error, refetch };
}

interface TaskStats {
  total: number;
  byStatus: { todo: number; "in-progress": number; done: number };
  byPriority: { high: number; medium: number; low: number };
}

export function useTaskStats(): TaskStats | null {
  const [stats, setStats] = useState<TaskStats | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_BASE}/tasks/stats/summary`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json: { data: TaskStats }) => setStats(json.data))
      .catch((err: Error) => {
        if (err.name !== "AbortError") {
          console.error("Failed to load stats:", err.message);
        }
      });

    return () => controller.abort();
  }, []);

  return stats;
}
