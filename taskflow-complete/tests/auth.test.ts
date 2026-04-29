import { describe, test, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import {
  authenticateToken,
  verifyApiKey,
  generateToken,
} from "../src/server/middleware/auth";

// JWT_SECRET and API_KEY are set globally in tests/setup.ts
const TEST_SECRET = process.env.JWT_SECRET!;
const TEST_API_KEY = process.env.API_KEY!;

describe("Authentication Middleware - generateToken", () => {
  test("should generate a token with three parts", () => {
    const token = generateToken("user123", "admin");
    const parts = token.split(".");
    expect(parts.length).toBe(3);
  });

  test("should generate different tokens for different users", () => {
    const token1 = generateToken("user1", "admin");
    const token2 = generateToken("user2", "user");
    expect(token1).not.toBe(token2);
  });

  test("should include user ID (sub) in payload", () => {
    const userId = "testuser123";
    const token = generateToken(userId, "admin");
    const payload = jwt.verify(token, TEST_SECRET) as { sub: string };
    expect(payload.sub).toBe(userId);
  });

  test("should include role in payload", () => {
    const token = generateToken("user123", "editor");
    const payload = jwt.verify(token, TEST_SECRET) as { role: string };
    expect(payload.role).toBe("editor");
  });

  test("should include iat claim", () => {
    const token = generateToken("user123", "admin");
    const payload = jwt.verify(token, TEST_SECRET) as { iat: number };
    expect(payload.iat).toBeDefined();
    expect(typeof payload.iat).toBe("number");
  });

  test("should include exp claim (approximately 1 hour from now)", () => {
    const before = Math.floor(Date.now() / 1000);
    const token = generateToken("user123", "admin");
    const payload = jwt.verify(token, TEST_SECRET) as { exp: number };
    expect(payload.exp).toBeDefined();
    expect(payload.exp).toBeGreaterThan(before + 3500);
  });

  test("should produce a verifiable HS256 JWT", () => {
    const token = generateToken("user123", "admin");
    const parts = token.split(".");
    const headerJson = Buffer.from(parts[0], "base64url").toString();
    const header = JSON.parse(headerJson) as { alg: string; typ: string };
    expect(header.alg).toBe("HS256");
    expect(header.typ).toBe("JWT");
  });
});

describe("Authentication Middleware - authenticateToken", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonResponse: unknown;
  let statusCode: number;

  beforeEach(() => {
    jsonResponse = null;
    statusCode = 200;
    mockReq = { headers: {} };
    mockRes = {
      status: vi.fn(function (this: Partial<Response>, code: number) {
        statusCode = code;
        return this;
      }),
      json: vi.fn(function (this: Partial<Response>, data: unknown) {
        jsonResponse = data;
        return this;
      }),
    };
    mockNext = vi.fn();
  });

  test("should call next() with a valid token", () => {
    const token = generateToken("user123", "admin");
    mockReq.headers = { authorization: `Bearer ${token}` };
    authenticateToken(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  test("should return 401 when no token provided", () => {
    mockReq.headers = {};
    authenticateToken(mockReq as Request, mockRes as Response, mockNext);
    expect(statusCode).toBe(401);
    expect(jsonResponse).toHaveProperty("error");
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should return 401 for malformed authorization header (no Bearer prefix)", () => {
    mockReq.headers = { authorization: "InvalidFormat" };
    authenticateToken(mockReq as Request, mockRes as Response, mockNext);
    expect(statusCode).toBe(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should return 401 for authorization header without Bearer scheme", () => {
    const token = generateToken("user123", "admin");
    mockReq.headers = { authorization: token };
    authenticateToken(mockReq as Request, mockRes as Response, mockNext);
    expect(statusCode).toBe(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should return 403 for forged token (wrong secret)", () => {
    const forgedToken = jwt.sign(
      { sub: "hacker", role: "admin" },
      "wrong-secret",
      { algorithm: "HS256" }
    );
    mockReq.headers = { authorization: `Bearer ${forgedToken}` };
    authenticateToken(mockReq as Request, mockRes as Response, mockNext);
    expect(statusCode).toBe(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should return 403 for expired token", () => {
    const expiredToken = jwt.sign(
      { sub: "user123", role: "user" },
      TEST_SECRET,
      { algorithm: "HS256", expiresIn: "0s" }
    );
    mockReq.headers = { authorization: `Bearer ${expiredToken}` };
    authenticateToken(mockReq as Request, mockRes as Response, mockNext);
    expect(statusCode).toBe(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should return 403 for completely invalid token string", () => {
    mockReq.headers = { authorization: "Bearer not.a.valid.jwt" };
    authenticateToken(mockReq as Request, mockRes as Response, mockNext);
    expect(statusCode).toBe(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should attach typed user data to request", () => {
    const userId = "testuser";
    const role = "admin";
    const token = generateToken(userId, role);
    mockReq.headers = { authorization: `Bearer ${token}` };
    authenticateToken(mockReq as Request, mockRes as Response, mockNext);
    expect((mockReq as Request).user).toBeDefined();
    expect((mockReq as Request).user?.sub).toBe(userId);
    expect((mockReq as Request).user?.role).toBe(role);
  });
});

describe("Authentication Middleware - verifyApiKey", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonResponse: unknown;
  let statusCode: number;

  beforeEach(() => {
    jsonResponse = null;
    statusCode = 200;
    mockReq = { headers: {} };
    mockRes = {
      status: vi.fn(function (this: Partial<Response>, code: number) {
        statusCode = code;
        return this;
      }),
      json: vi.fn(function (this: Partial<Response>, data: unknown) {
        jsonResponse = data;
        return this;
      }),
    };
    mockNext = vi.fn();
  });

  test("should call next() with valid API key", () => {
    mockReq.headers = { "x-api-key": TEST_API_KEY };
    verifyApiKey(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  test("should return 401 when no API key provided", () => {
    mockReq.headers = {};
    verifyApiKey(mockReq as Request, mockRes as Response, mockNext);
    expect(statusCode).toBe(401);
    expect(jsonResponse).toHaveProperty("error");
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should return 403 for invalid API key", () => {
    mockReq.headers = { "x-api-key": "invalid-key" };
    verifyApiKey(mockReq as Request, mockRes as Response, mockNext);
    expect(statusCode).toBe(403);
    expect(jsonResponse).toHaveProperty("error");
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should return 401 for empty API key (treated as missing)", () => {
    mockReq.headers = { "x-api-key": "" };
    verifyApiKey(mockReq as Request, mockRes as Response, mockNext);
    expect(statusCode).toBe(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should differentiate between missing (401) and invalid (403) key", () => {
    mockReq.headers = {};
    verifyApiKey(mockReq as Request, mockRes as Response, mockNext);
    expect(statusCode).toBe(401);

    statusCode = 200;
    mockReq.headers = { "x-api-key": "wrong-key" };
    verifyApiKey(mockReq as Request, mockRes as Response, mockNext);
    expect(statusCode).toBe(403);
  });

  test("should require exact API key match — shorter key rejected", () => {
    mockReq.headers = { "x-api-key": TEST_API_KEY.slice(0, -1) };
    verifyApiKey(mockReq as Request, mockRes as Response, mockNext);
    expect(statusCode).toBe(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should reject API key with leading space", () => {
    mockReq.headers = { "x-api-key": ` ${TEST_API_KEY}` };
    verifyApiKey(mockReq as Request, mockRes as Response, mockNext);
    expect(statusCode).toBe(403);
  });

  test("should reject key differing only in last character", () => {
    const lastChar = TEST_API_KEY.charAt(TEST_API_KEY.length - 1);
    const diffChar = lastChar === "3" ? "4" : "3";
    const similar = TEST_API_KEY.slice(0, -1) + diffChar;
    mockReq.headers = { "x-api-key": similar };
    verifyApiKey(mockReq as Request, mockRes as Response, mockNext);
    expect(statusCode).toBe(403);
  });
});

describe("Authentication - Integration", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {
      status: vi.fn(function (this: Partial<Response>) { return this; }),
      json: vi.fn(function (this: Partial<Response>) { return this; }),
    };
    mockNext = vi.fn();
  });

  test("should allow token and API key authentication separately", () => {
    const token = generateToken("user123", "admin");
    mockReq.headers = { authorization: `Bearer ${token}` };
    authenticateToken(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);

    (mockNext as ReturnType<typeof vi.fn>).mockClear();
    mockReq.headers = { "x-api-key": TEST_API_KEY };
    verifyApiKey(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  test("should preserve user data through authentication chain", () => {
    const userId = "chaintest";
    const role = "viewer";
    const token = generateToken(userId, role);
    mockReq.headers = { authorization: `Bearer ${token}` };
    authenticateToken(mockReq as Request, mockRes as Response, mockNext);
    expect((mockReq as Request).user?.sub).toBe(userId);
    expect((mockReq as Request).user?.role).toBe(role);
  });
});
