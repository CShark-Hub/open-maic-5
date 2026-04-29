import { useState, useEffect, useRef, useCallback } from "react";
import { Task, TaskFilterQuery } from "../../types";

const API_BASE = "http://localhost:3001/api";

export interface UseFilteredTasksResult {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches tasks from GET /api/tasks/filter with validated query params.
 * Requires a bearer token passed as the `token` argument.
 * Aborts the in-flight request when the component unmounts or params change.
 */
export function useFilteredTasks(
  query: TaskFilterQuery,
  token: string
): UseFilteredTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const queryKey = JSON.stringify(query);
  const prevQueryKey = useRef<string | null>(null);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    // Skip if nothing changed (not a forced refetch) and no token
    if (prevQueryKey.current === queryKey && tick === 0) return;
    prevQueryKey.current = queryKey;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.search && query.search.trim().length > 0) {
      params.set("search", query.search.trim());
    }

    const url = `${API_BASE}/tasks/filter?${params.toString()}`;

    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

    return () => {
      controller.abort();
    };
  }, [queryKey, token, tick]);

  return { tasks, loading, error, refetch };
}
