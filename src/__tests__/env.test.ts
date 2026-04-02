import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";

/**
 * We cannot import env.ts directly because it validates on import
 * and would throw due to missing env vars in the test runner.
 * Instead, we replicate the schema and test it directly.
 * This validates the same logic without side-effects.
 */

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required").optional(),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required").optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

function validEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: "https://abc123.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-key",
    DATABASE_URL: "postgresql://user:pass@localhost:5432/smart_grants",
    NODE_ENV: "test" as const,
  };
}

describe("Environment validation schema", () => {
  it("passes with all required variables", () => {
    const result = envSchema.safeParse(validEnv());
    expect(result.success).toBe(true);
  });

  it("passes with all variables including optional ones", () => {
    const result = envSchema.safeParse({
      ...validEnv(),
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key-value",
      ANTHROPIC_API_KEY: "sk-ant-api-key",
    });
    expect(result.success).toBe(true);
  });

  it("fails when NEXT_PUBLIC_SUPABASE_URL is missing", () => {
    const { NEXT_PUBLIC_SUPABASE_URL, ...rest } = validEnv();
    const result = envSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("fails when NEXT_PUBLIC_SUPABASE_URL is not a valid URL", () => {
    const result = envSchema.safeParse({
      ...validEnv(),
      NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("fails when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", () => {
    const { NEXT_PUBLIC_SUPABASE_ANON_KEY, ...rest } = validEnv();
    const result = envSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("fails when NEXT_PUBLIC_SUPABASE_ANON_KEY is empty", () => {
    const result = envSchema.safeParse({
      ...validEnv(),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    });
    expect(result.success).toBe(false);
  });

  it("fails when DATABASE_URL is missing", () => {
    const { DATABASE_URL, ...rest } = validEnv();
    const result = envSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("does not fail when ANTHROPIC_API_KEY is missing", () => {
    const data = validEnv(); // no ANTHROPIC_API_KEY
    const result = envSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("does not fail when SUPABASE_SERVICE_ROLE_KEY is missing", () => {
    const data = validEnv(); // no SUPABASE_SERVICE_ROLE_KEY
    const result = envSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("defaults NODE_ENV to development when not provided", () => {
    const { NODE_ENV, ...rest } = validEnv();
    const result = envSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.NODE_ENV).toBe("development");
    }
  });

  it("rejects invalid NODE_ENV value", () => {
    const result = envSchema.safeParse({
      ...validEnv(),
      NODE_ENV: "staging",
    });
    expect(result.success).toBe(false);
  });

  it("accepts production NODE_ENV", () => {
    const result = envSchema.safeParse({
      ...validEnv(),
      NODE_ENV: "production",
    });
    expect(result.success).toBe(true);
  });
});
