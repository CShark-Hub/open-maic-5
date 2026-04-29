import { Router, Request, Response } from "express";
import { z } from "zod";
import { generateToken } from "../middleware/auth";

const router = Router();

const loginSchema = z.object({
  userId: z
    .string({ required_error: "userId is required" })
    .min(1)
    .max(80),
  role: z.enum(["admin", "user", "viewer"], {
    errorMap: () => ({ message: "role must be admin, user, or viewer" }),
  }),
});

/**
 * POST /api/auth/login
 * Demo login — issues a signed JWT for the given userId + role.
 * No password check: this is a demonstration of the token flow only.
 * Returns: { data: { token: string } }
 */
router.post("/login", (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.errors.map((e) => e.message).join(", ");
    return res.status(400).json({ error: messages });
  }

  const { userId, role } = result.data;
  const token = generateToken(userId, role);
  return res.json({ data: { token } });
});

export default router;
