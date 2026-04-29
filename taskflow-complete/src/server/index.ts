import express from "express";
import cors from "cors";
import taskRoutes from "./routes/tasks";
import authRoutes from "./routes/auth";
import { getJwtSecret } from "./middleware/auth";

// Fix #1: Fail fast if JWT_SECRET is not configured.
try {
  getJwtSecret();
} catch (err) {
  console.error("[FATAL]", (err as Error).message);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Public routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
);

app.listen(PORT, () => {
  console.log(`TaskFlow server running on port ${PORT}`);
});

export default app;
