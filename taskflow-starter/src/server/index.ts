import express from "express";
import cors from "cors";
import taskRoutes from "./routes/tasks";
import { authenticateToken } from "./middleware/auth";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Public routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Protected routes
app.use("/api/tasks", taskRoutes);

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`TaskFlow server running on port ${PORT}`);
});

export default app;
