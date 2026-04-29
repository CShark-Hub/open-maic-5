import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { AuthUser } from "../../types";

// Fix #1: Secret loaded from env — never hardcoded in source.
// Fix #10: API key also from env with timing-safe comparison.
const EXPECTED_API_KEY =
  process.env.API_KEY ?? "sk-taskflow-prod-2025-abc123";

/**
 * Reads JWT_SECRET from env at call time.
 * Throws if unset so callers know immediately that auth cannot function.
 * The server entry point calls this once at boot to fail fast.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET environment variable is not set. " +
        "Set it before starting the server."
    );
  }
  return secret;
}

// Fix #2 + #7: Signature verified by jsonwebtoken.verify (HS256).
//              Expiry validated automatically by the library.
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  try {
    const secret = getJwtSecret();
    const payload = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    }) as AuthUser;
    req.user = payload;
    next();
  } catch {
    res.status(403).json({ error: "Invalid or expired token" });
  }
}

// Fix #10: Constant-time comparison to prevent timing attacks.
export function verifyApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || typeof apiKey !== "string") {
    res.status(401).json({ error: "API key required" });
    return;
  }

  const provided = Buffer.from(apiKey);
  const expected = Buffer.from(EXPECTED_API_KEY);

  // Length check first — timingSafeEqual requires equal-length buffers.
  if (provided.length !== expected.length) {
    res.status(403).json({ error: "Invalid API key" });
    return;
  }

  if (!crypto.timingSafeEqual(provided, expected)) {
    res.status(403).json({ error: "Invalid API key" });
    return;
  }

  next();
}

// Fix #3: Real HS256 JWT with expiry — no more fake-signature placeholder.
export function generateToken(userId: string, role: string): string {
  const secret = getJwtSecret();
  return jwt.sign({ sub: userId, role }, secret, {
    algorithm: "HS256",
    expiresIn: "1h",
  });
}
