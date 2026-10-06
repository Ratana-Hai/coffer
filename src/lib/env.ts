import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  SHADOW_DATABASE_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(32),
  NODE_ENV: z.enum(["development", "test", "production"]),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  SHADOW_DATABASE_URL: process.env.SHADOW_DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NODE_ENV: process.env.NODE_ENV,
});
