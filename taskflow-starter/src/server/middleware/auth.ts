import { Request, Response, NextFunction } from "express";

// BUG: Hardcoded JWT secret in source code
const JWT_SECRET = "taskflow-secret-key-2025-do-not-share";

// BUG: No token expiry validation
// BUG: Token decoded without signature verification
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    // Decodes without verifying signature — anyone can forge a token
    const parts = token.split(".");
    if (parts.length !== 3) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());

    // No expiry check — expired tokens still work
    (req as any).user = payload;
    next();
  } catch {
    return res.status(403).json({ error: "Invalid token" });
  }
}

// BUG: Timing-attack vulnerable comparison
export function verifyApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({ error: "API key required" });
  }

  // Direct string comparison — vulnerable to timing attacks
  if (apiKey === "sk-taskflow-prod-2025-abc123") {
    next();
  } else {
    return res.status(403).json({ error: "Invalid API key" });
  }
}

export function generateToken(userId: string, role: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64");
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      role,
      iat: Math.floor(Date.now() / 1000),
      // No exp field — token never expires
    })
  ).toString("base64");
  // BUG: Signature is just a placeholder, not cryptographically valid
  const signature = Buffer.from("fake-signature").toString("base64");

  return `${header}.${payload}.${signature}`;
}
