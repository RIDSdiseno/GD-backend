// src/env.ts
import "dotenv/config";

/** Normaliza y separa orígenes tipo: "http://localhost:5173,https://crmgdiamond.netlify.app" */
function parseOrigins(raw?: string, fallback = "http://localhost:5173"): string[] {
  return (raw ?? fallback)
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    // quita trailing slash para comparar sin confusiones
    .map(s => s.replace(/\/$/, ""));
}

/** Convierte números con fallback seguro */
function toNumber(v: string | undefined, def: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : def;
}

export type NodeEnv = "development" | "test" | "production";

export const env = {
  NODE_ENV: (process.env.NODE_ENV as NodeEnv) ?? "development",
  PORT: toNumber(process.env.PORT, 4000),
  // Render requiere bind a 0.0.0.0
  HOST: process.env.HOST ?? "0.0.0.0",

  // CORS: lista ya parseada (string[])
  CORS_ORIGIN: parseOrigins(process.env.CORS_ORIGIN),

  // Auth
  JWT_SECRET: process.env.JWT_SECRET ?? "change_me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "15m",

  // DB (Supabase)
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  DIRECT_URL: process.env.DIRECT_URL ?? "",
} as const;

export const isProd = env.NODE_ENV === "production";
export const isDev = env.NODE_ENV === "development";
