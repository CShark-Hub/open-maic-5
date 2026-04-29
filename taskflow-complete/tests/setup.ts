/**
 * Global test setup — sets required environment variables before any test
 * module is imported so that lazy env-reads in middleware/auth.ts succeed.
 */
process.env.JWT_SECRET = "test-secret-do-not-use-in-production";
process.env.API_KEY = "sk-taskflow-prod-2025-abc123";
