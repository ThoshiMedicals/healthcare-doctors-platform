import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  AUTH_URL: z.string().url().optional(),
  AUTH_TRUST_HOST: z.string().optional(),
  DEFAULT_CLINIC_SLUG: z.string().min(1).default("woolloongabba"),
  SEED_ADMIN_EMAIL: z.string().email().optional().or(z.literal("")),
  SEED_ADMIN_PASSWORD: z.string().optional().or(z.literal("")),
  FORM_REQUEST_NOTIFY_EMAIL: z.string().email().optional().or(z.literal("")),
});

export type AppEnv = z.infer<typeof envSchema>;

export function getEnv(): AppEnv {
  return envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL || undefined,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
    DEFAULT_CLINIC_SLUG: process.env.DEFAULT_CLINIC_SLUG,
    SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL,
    SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD,
    FORM_REQUEST_NOTIFY_EMAIL: process.env.FORM_REQUEST_NOTIFY_EMAIL,
  });
}
