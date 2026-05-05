import { z } from "zod";

/**
 * Validate required environment variables at import time.
 * Throws a descriptive error if any are missing or invalid.
 */
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required").optional(),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // AI
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required").optional(),

  // Crawler
  CRAWLER_SERVICE_URL: z.string().url("CRAWLER_SERVICE_URL must be a valid URL").optional(),
  CRAWLER_API_KEY: z.string().min(1, "CRAWLER_API_KEY is required").optional(),

  // Node
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

function validateEnv() {
  // Skip validation during build phase (env vars not available)
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return process.env as unknown as z.infer<typeof envSchema>;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const messages = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${msgs?.join(", ")}`)
      .join("\n");
    console.error(`Environment validation failed:\n${messages}`);
    throw new Error(`Missing or invalid environment variables:\n${messages}`);
  }

  return parsed.data;
}

export const env = validateEnv();
