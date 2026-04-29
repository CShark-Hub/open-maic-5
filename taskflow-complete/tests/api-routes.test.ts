import { describe, test, expect, beforeEach } from "vitest";
import request from "supertest";
import express, { Express } from "express";
import tasksRouter from "../src/server/routes/tasks";
import { generateToken } from "../src/server/middleware/auth";

// JWT_SECRET is set in tests/setup.ts

let app: Express;
let adminToken: string;
let userToken: string;

beforeEach(() => {
  app = express();
  app.use(express.json());
  app.use("/api/tasks", tasksRouter);

  // Generate valid tokens for each test run
  adminToken = generateToken("admin-user", "admin");
  userToken = generateToken("anna", "user"); // "anna" matches seed task assignees
});

// ─── GET /api/tasks ────────────────────────────────────────────────────────

describe("GET /api/tasks", () => {
  test("should return 401 when no token provided", async () => {
    const response = await request(app).get("/api/tasks");
    expect(response.status).toBe(401);
  });

  test("should return all tasks with valid token", async () => {
    const response = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  test("should filter tasks by status query parameter", async () => {
    const response = await request(app)
      .get("/api/tasks?status=done")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.every((t: { status: string }) => t.status === "done")).toBe(true);
  });

  test("should filter tasks by priority query parameter", async () => {
    const response = await request(app)
      .get("/api/tasks?priority=high")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.every((t: { priority: string }) => t.priority === "high")).toBe(true);
  });

  test("should filter tasks by assignee query parameter", async () => {
    const response = await request(app)
      .get("/api/tasks?assignee=anna")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.every((t: { assignee: string }) => t.assignee === "anna")).toBe(true);
  });

  test("should combine multiple filters", async () => {
    const response = await request(app)
      .get("/api/tasks?status=done&priority=high")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(
      response.body.data.every(
        (t: { status: string; priority: string }) =>
          t.status === "done" && t.priority === "high"
      )
    ).toBe(true);
  });

  test("should return empty array when filters match nothing", async () => {
    const response = await request(app)
      .get("/api/tasks?status=invalid-status")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  test("should return enriched tasks with assignee details when enriched=true", async () => {
    const response = await request(app)
      .get("/api/tasks?enriched=true")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  test("should return tasks with correct structure", async () => {
    const response = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    const task = response.body.data[0];
    expect(task).toHaveProperty("id");
    expect(task).toHaveProperty("title");
    expect(task).toHaveProperty("description");
    expect(task).toHaveProperty("status");
    expect(task).toHaveProperty("priority");
  });
});

// ─── GET /api/tasks/:id ────────────────────────────────────────────────────

describe("GET /api/tasks/:id", () => {
  test("should return a single task by ID (public endpoint)", async () => {
    const listResponse = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${adminToken}`);
    const taskId = listResponse.body.data[0].id;

    const response = await request(app).get(`/api/tasks/${taskId}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(taskId);
    expect(response.body).toHaveProperty("data");
  });

  test("should return 404 when task does not exist", async () => {
    const response = await request(app).get("/api/tasks/nonexistent-id-99999");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Task not found");
  });

  test("should return correct task data", async () => {
    const listResponse = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${adminToken}`);
    const task = listResponse.body.data[0];

    const response = await request(app).get(`/api/tasks/${task.id}`);

    expect(response.status).toBe(200);
    expect(response.body.data.title).toBe(task.title);
    expect(response.body.data.priority).toBe(task.priority);
  });
});

// ─── POST /api/tasks ───────────────────────────────────────────────────────

describe("POST /api/tasks", () => {
  test("should return 401 when no token provided", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .send({ title: "test", description: "desc", priority: "high" });

    expect(response.status).toBe(401);
  });

  test("should create a new task with valid token and body", async () => {
    const taskData = {
      title: "Integration test task",
      description: "Created via API",
      priority: "high",
      assignee: "tomek",
    };

    const response = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(taskData);

    expect(response.status).toBe(201);
    expect(response.body.data.title).toBe(taskData.title);
    expect(response.body.data.description).toBe(taskData.description);
    expect(response.body.data.priority).toBe(taskData.priority);
    expect(response.body.data.assignee).toBe(taskData.assignee);
    expect(response.body.data.status).toBe("todo");
    expect(response.body.data.id).toBeDefined();
  });

  test("should return 400 when title is empty", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "", description: "desc", priority: "high" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  test("should return 400 when title exceeds 200 characters", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "a".repeat(201), description: "desc", priority: "high" });

    expect(response.status).toBe(400);
  });

  test("should return 400 for invalid priority", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Test", description: "desc", priority: "urgent" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  test("should return 400 when description exceeds 2000 characters", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Test", description: "x".repeat(2001), priority: "low" });

    expect(response.status).toBe(400);
  });

  test("should return 400 when assignee exceeds 80 characters", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Test", description: "desc", priority: "low", assignee: "a".repeat(81) });

    expect(response.status).toBe(400);
  });

  test("should create task without optional assignee", async () => {
    const taskData = {
      title: "Unassigned task",
      description: "No assignee provided",
      priority: "medium",
    };

    const response = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(taskData);

    expect(response.status).toBe(201);
    expect(response.body.data.title).toBe(taskData.title);
  });

  test("should accept all valid priority levels", async () => {
    for (const priority of ["low", "medium", "high"]) {
      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ title: `Priority ${priority}`, description: "Test", priority });

      expect(response.status).toBe(201);
      expect(response.body.data.priority).toBe(priority);
    }
  });

  test("should set timestamps on created task", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Timestamp test", description: "Test", priority: "low" });

    expect(response.status).toBe(201);
    expect(response.body.data.createdAt).toBeDefined();
    expect(response.body.data.updatedAt).toBeDefined();
  });
});

// ─── PUT /api/tasks/:id ────────────────────────────────────────────────────

describe("PUT /api/tasks/:id", () => {
  test("should return 401 when no token provided", async () => {
    const response = await request(app)
      .put("/api/tasks/1")
      .send({ title: "Updated" });

    expect(response.status).toBe(401);
  });

  test("should update existing task when user is admin", async () => {
    const listResponse = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${adminToken}`);
    const taskId = listResponse.body.data[0].id;

    const updateData = { title: "Updated title", status: "in-progress" };

    const response = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.data.title).toBe(updateData.title);
    expect(response.body.data.status).toBe(updateData.status);
  });

  test("should return 400 for invalid status value", async () => {
    const listResponse = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${adminToken}`);
    const taskId = listResponse.body.data[0].id;

    const response = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "invalid-status" });

    expect(response.status).toBe(400);
  });

  test("should return 404 when updating non-existent task", async () => {
    const response = await request(app)
      .put("/api/tasks/nonexistent-id-99999")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Updated" });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Task not found");
  });

  test("should return 403 when user does not own the task", async () => {
    // task id=1 is assigned to "anna"; userToken sub="anna" so admin owns, other user does not
    const otherToken = generateToken("bob", "user"); // "bob" is not the assignee

    // Get a task assigned to anna
    const listResponse = await request(app)
      .get("/api/tasks?assignee=anna")
      .set("Authorization", `Bearer ${adminToken}`);
    const taskId = listResponse.body.data[0].id;

    const response = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ title: "Trying to update someone elses task" });

    expect(response.status).toBe(403);
  });

  test("should preserve unchanged fields during update", async () => {
    const listResponse = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${adminToken}`);
    const original = listResponse.body.data[0];

    const response = await request(app)
      .put(`/api/tasks/${original.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "New title only" });

    expect(response.status).toBe(200);
    expect(response.body.data.priority).toBe(original.priority);
    expect(response.body.data.description).toBe(original.description);
  });
});

// ─── DELETE /api/tasks/:id ─────────────────────────────────────────────────

describe("DELETE /api/tasks/:id", () => {
  test("should return 401 when no token provided", async () => {
    const response = await request(app).delete("/api/tasks/1");
    expect(response.status).toBe(401);
  });

  test("should delete existing task when admin", async () => {
    const taskData = {
      title: "Task to delete",
      description: "Will be deleted",
      priority: "low",
    };
    const createResponse = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(taskData);
    const taskId = createResponse.body.data.id;

    const deleteResponse = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.data.deleted).toBe(true);
  });

  test("should return 403 when user does not own the task", async () => {
    // Create an unassigned task then try to delete as a different user
    // First create task assigned to anna
    const createResponse = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Anna's task", description: "desc", priority: "low", assignee: "anna" });
    const taskId = createResponse.body.data.id;

    const bobToken = generateToken("bob", "user");
    const deleteResponse = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${bobToken}`);

    expect(deleteResponse.status).toBe(403);
  });

  test("should return 404 when deleting non-existent task", async () => {
    const response = await request(app)
      .delete("/api/tasks/nonexistent-id-99999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Task not found");
  });

  test("should make deleted task inaccessible", async () => {
    const createResponse = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Delete and verify", description: "Test", priority: "medium" });
    const taskId = createResponse.body.data.id;

    await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    const getResponse = await request(app).get(`/api/tasks/${taskId}`);
    expect(getResponse.status).toBe(404);
  });

  test("should not affect other tasks when deleting", async () => {
    const listBefore = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${adminToken}`);
    const otherTaskId = listBefore.body.data[0].id;

    const createResponse = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Delete me", description: "Test", priority: "low" });
    const taskIdToDelete = createResponse.body.data.id;

    await request(app)
      .delete(`/api/tasks/${taskIdToDelete}`)
      .set("Authorization", `Bearer ${adminToken}`);

    const otherTaskResponse = await request(app).get(`/api/tasks/${otherTaskId}`);
    expect(otherTaskResponse.status).toBe(200);
  });
});

// ─── GET /api/tasks/stats/summary ──────────────────────────────────────────

describe("GET /api/tasks/stats/summary", () => {
  test("should return task statistics (public endpoint)", async () => {
    const response = await request(app).get("/api/tasks/stats/summary");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("total");
    expect(response.body.data).toHaveProperty("byStatus");
    expect(response.body.data).toHaveProperty("byPriority");
  });

  test("should include status breakdown", async () => {
    const response = await request(app).get("/api/tasks/stats/summary");

    expect(response.status).toBe(200);
    expect(response.body.data.byStatus).toHaveProperty("todo");
    expect(response.body.data.byStatus).toHaveProperty("in-progress");
    expect(response.body.data.byStatus).toHaveProperty("done");
  });

  test("should include priority breakdown", async () => {
    const response = await request(app).get("/api/tasks/stats/summary");

    expect(response.status).toBe(200);
    expect(response.body.data.byPriority).toHaveProperty("high");
    expect(response.body.data.byPriority).toHaveProperty("medium");
    expect(response.body.data.byPriority).toHaveProperty("low");
  });
});

// ─── GET /api/tasks/filter ─────────────────────────────────────────────────

describe("GET /api/tasks/filter", () => {
  test("should return 401 without token", async () => {
    const response = await request(app).get("/api/tasks/filter?search=login");
    expect(response.status).toBe(401);
  });

  test("should return filtered results with valid token", async () => {
    const response = await request(app)
      .get("/api/tasks/filter?search=CI")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test("should return 400 for invalid status on filter endpoint", async () => {
    const response = await request(app)
      .get("/api/tasks/filter?status=invalid")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  test("should return 400 when search exceeds 200 characters", async () => {
    const response = await request(app)
      .get(`/api/tasks/filter?search=${"x".repeat(201)}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
  });
});
