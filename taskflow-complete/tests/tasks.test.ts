import { describe, test, expect, beforeEach, vi } from "vitest";
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  filterTasks,
  getTasksWithAssigneeDetails,
} from "../src/server/db/tasks";
import { Task, CreateTaskInput, UpdateTaskInput } from "../src/types";

describe("Task DB - getAllTasks", () => {
  test("should return all tasks including seed data", () => {
    const tasks = getAllTasks();
    expect(tasks.length).toBeGreaterThan(0);
    expect(Array.isArray(tasks)).toBe(true);
  });

  test("should return tasks with correct structure", () => {
    const tasks = getAllTasks();
    const task = tasks[0];
    expect(task).toHaveProperty("id");
    expect(task).toHaveProperty("title");
    expect(task).toHaveProperty("description");
    expect(task).toHaveProperty("status");
    expect(task).toHaveProperty("priority");
    expect(task).toHaveProperty("createdAt");
    expect(task).toHaveProperty("updatedAt");
  });

  test("should return consistent data across multiple calls", () => {
    const first = getAllTasks();
    const second = getAllTasks();
    expect(first.length).toBe(second.length);
  });
});

describe("Task DB - getTaskById", () => {
  test("should return a task when ID exists", () => {
    const allTasks = getAllTasks();
    const task = getTaskById(allTasks[0].id);
    expect(task).toBeDefined();
    expect(task?.id).toBe(allTasks[0].id);
  });

  test("should return undefined when ID does not exist", () => {
    const task = getTaskById("nonexistent-id-99999");
    expect(task).toBeUndefined();
  });

  test("should return correct task data when retrieving by various IDs", () => {
    const allTasks = getAllTasks();
    const task1 = getTaskById(allTasks[0].id);
    const task2 = getTaskById(allTasks[1].id);
    expect(task1?.id).not.toBe(task2?.id);
    expect(task1?.title).not.toBe(task2?.title);
  });

  test("should return undefined for empty string ID", () => {
    const task = getTaskById("");
    expect(task).toBeUndefined();
  });
});

describe("Task DB - createTask", () => {
  test("should create a task with valid input", () => {
    const input: CreateTaskInput = {
      title: "New task",
      description: "Task description",
      priority: "high",
      assignee: "anna",
    };
    const before = getAllTasks().length;
    const task = createTask(input);

    expect(task).toBeDefined();
    expect(task.title).toBe(input.title);
    expect(task.description).toBe(input.description);
    expect(task.priority).toBe(input.priority);
    expect(task.assignee).toBe(input.assignee);
    expect(task.status).toBe("todo");
    expect(task.id).toBeDefined();
    expect(task.createdAt).toBeDefined();
    expect(task.updatedAt).toBeDefined();
    expect(getAllTasks().length).toBe(before + 1);
  });

  test("should create task without optional assignee", () => {
    const input: CreateTaskInput = {
      title: "Unassigned task",
      description: "No assignee",
      priority: "low",
    };
    const task = createTask(input);
    expect(task.assignee).toBeUndefined();
  });

  test("should assign incrementing IDs", () => {
    const task1 = createTask({
      title: "First",
      description: "Desc1",
      priority: "medium",
    });
    const task2 = createTask({
      title: "Second",
      description: "Desc2",
      priority: "medium",
    });
    expect(parseInt(task2.id) > parseInt(task1.id)).toBe(true);
  });

  test("should set createdAt and updatedAt timestamps", () => {
    const before = new Date();
    const task = createTask({
      title: "Time test",
      description: "Test",
      priority: "low",
    });
    const after = new Date();

    const createdTime = new Date(task.createdAt);
    const updatedTime = new Date(task.updatedAt);

    expect(createdTime.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(createdTime.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(task.createdAt).toBe(task.updatedAt);
  });
});

describe("Task DB - updateTask", () => {
  test("should update existing task", () => {
    const originalTasks = getAllTasks();
    const targetId = originalTasks[0].id;
    const update: UpdateTaskInput = {
      title: "Updated title",
      status: "in-progress",
    };

    const updated = updateTask(targetId, update);

    expect(updated).toBeDefined();
    expect(updated?.title).toBe("Updated title");
    expect(updated?.status).toBe("in-progress");
    expect(updated?.id).toBe(targetId);
  });

  test("should return null when updating non-existent task", () => {
    const update: UpdateTaskInput = { title: "Updated" };
    const result = updateTask("nonexistent-id-99999", update);
    expect(result).toBeNull();
  });

  test("should preserve unchanged fields during update", () => {
    const originalTasks = getAllTasks();
    const targetId = originalTasks[0].id;
    const original = getTaskById(targetId)!;

    const update: UpdateTaskInput = { title: "New title" };
    const updated = updateTask(targetId, update)!;

    expect(updated.priority).toBe(original.priority);
    expect(updated.description).toBe(original.description);
    expect(updated.createdAt).toBe(original.createdAt);
  });

  test("should update updatedAt timestamp", () => {
    const originalTasks = getAllTasks();
    const targetId = originalTasks[0].id;
    const original = getTaskById(targetId)!;

    // Sleep a tiny bit to ensure timestamp difference
    const before = new Date();
    const updated = updateTask(targetId, { title: "Updated title explicitly for timestamp" });
    const after = new Date();

    // Check that updatedAt is different or at least meets time window
    const updatedTime = new Date(updated?.updatedAt!);
    expect(updatedTime.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1);
    expect(updatedTime.getTime()).toBeLessThanOrEqual(after.getTime() + 1);
  });

  test("should handle partial updates with multiple fields", () => {
    const targetId = getAllTasks()[0].id;
    const updated = updateTask(targetId, {
      status: "done",
      priority: "low",
      assignee: "tomek",
    });

    expect(updated?.status).toBe("done");
    expect(updated?.priority).toBe("low");
    expect(updated?.assignee).toBe("tomek");
  });
});

describe("Task DB - deleteTask", () => {
  test("should delete existing task", () => {
    const input: CreateTaskInput = {
      title: "Task to delete",
      description: "Will be deleted",
      priority: "low",
    };
    const task = createTask(input);
    const before = getAllTasks().length;

    const deleted = deleteTask(task.id);

    expect(deleted).toBe(true);
    expect(getAllTasks().length).toBe(before - 1);
    expect(getTaskById(task.id)).toBeUndefined();
  });

  test("should return false when deleting non-existent task", () => {
    const deleted = deleteTask("nonexistent-id-99999");
    expect(deleted).toBe(false);
  });

  test("should return false on second deletion of same ID", () => {
    const task = createTask({
      title: "Double delete test",
      description: "Test",
      priority: "low",
    });
    deleteTask(task.id);
    const secondDelete = deleteTask(task.id);
    expect(secondDelete).toBe(false);
  });

  test("should not affect other tasks when deleting", () => {
    const allBefore = getAllTasks();
    const taskToDelete = createTask({
      title: "Delete me",
      description: "Test",
      priority: "medium",
    });
    const otherTaskId = allBefore[0].id;

    deleteTask(taskToDelete.id);

    const otherTask = getTaskById(otherTaskId);
    expect(otherTask).toBeDefined();
  });
});

describe("Task DB - filterTasks", () => {
  test("should filter tasks by status", () => {
    const filtered = filterTasks({ status: "done" });
    expect(filtered.every((t) => t.status === "done")).toBe(true);
  });

  test("should filter tasks by priority", () => {
    const filtered = filterTasks({ priority: "high" });
    expect(filtered.every((t) => t.priority === "high")).toBe(true);
  });

  test("should filter tasks by assignee", () => {
    const filtered = filterTasks({ assignee: "anna" });
    expect(filtered.every((t) => t.assignee === "anna")).toBe(true);
  });

  test("should apply multiple filters (AND logic)", () => {
    const filtered = filterTasks({
      status: "done",
      priority: "high",
    });
    expect(
      filtered.every((t) => t.status === "done" && t.priority === "high")
    ).toBe(true);
  });

  test("should return all tasks with empty filters", () => {
    const filtered = filterTasks({});
    const all = getAllTasks();
    expect(filtered.length).toBe(all.length);
  });

  test("should return empty array when no tasks match filters", () => {
    const filtered = filterTasks({
      status: "done",
      priority: "low",
      assignee: "nonexistent",
    });
    expect(filtered).toEqual([]);
  });

  test("should handle invalid filter values gracefully", () => {
    const filtered = filterTasks({ status: "invalid-status" });
    expect(filtered.length).toBe(0);
  });

  test("should filter with only assignee parameter", () => {
    const filtered = filterTasks({ assignee: "tomek" });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((t) => t.assignee === "tomek")).toBe(true);
  });
});

describe("Task DB - getTasksWithAssigneeDetails", () => {
  test("should enrich tasks with assignee details", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const enriched = getTasksWithAssigneeDetails();
    expect(Array.isArray(enriched)).toBe(true);
    expect(enriched.length).toBeGreaterThan(0);
  });

  test("should include assigneeDetails property in enriched tasks", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const enriched = getTasksWithAssigneeDetails();
    const assignedTask = enriched.find((t) => t.assignee);
    if (assignedTask) {
      expect(assignedTask).toHaveProperty("assigneeDetails");
    }
  });

  test("should return null assigneeDetails for unassigned tasks", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const enriched = getTasksWithAssigneeDetails();
    const unassignedTask = enriched.find((t) => !t.assignee);
    if (unassignedTask) {
      expect(unassignedTask.assigneeDetails).toBeNull();
    }
  });

  test("should match enriched task data with original task", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const enriched = getTasksWithAssigneeDetails();
    const original = getAllTasks()[0];
    const enrichedMatch = enriched.find((t) => t.id === original.id);

    expect(enrichedMatch?.id).toBe(original.id);
    expect(enrichedMatch?.title).toBe(original.title);
    expect(enrichedMatch?.status).toBe(original.status);
  });
});
