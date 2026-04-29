import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

const API_BASE = "http://localhost:3001/api";

interface AuthState {
  token: string | null;
  userId: string | null;
  role: string | null;
}

interface AuthContextValue extends AuthState {
  login: (userId: string, role: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    token: null,
    userId: null,
    role: null,
  });

  const login = useCallback(async (userId: string, role: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });

    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      throw new Error(body.error ?? "Login failed");
    }

    const { data } = (await res.json()) as { data: { token: string } };
    setAuth({ token: data.token, userId, role });
  }, []);

  const logout = useCallback(() => {
    setAuth({ token: null, userId: null, role: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
