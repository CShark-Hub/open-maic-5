import { useState, useEffect } from "react";
import { Task } from "../../types";

const API_BASE = "http://localhost:3001/api";

// BUG: No abort controller — memory leak if component unmounts during fetch
// BUG: No error state handling
// BUG: Refetches on every render when filters change (no debounce)
export function useTasks(filters?: Record<string, string>) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    let url = `${API_BASE}/tasks`;
    if (filters && Object.keys(filters).length > 0) {
      const params = new URLSearchParams(filters);
      url += `?${params.toString()}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        setTasks(json.data);
        setLoading(false);
      });
    // No cleanup function — fetch continues after unmount
    // No error handling — silently fails
  }, [JSON.stringify(filters)]); // BUG: JSON.stringify in deps causes unnecessary re-renders

  return { tasks, loading };
}

export function useTaskStats() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE}/tasks/stats/summary`)
      .then((res) => res.json())
      .then((json) => setStats(json.data));
  }, []);

  return stats;
}
