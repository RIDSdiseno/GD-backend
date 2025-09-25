// src/env.ts
import "dotenv/config";

function parseOrigins(raw: string | undefined, def = "http://localhost:5173") {
  return (raw ?? def)
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 4000),
  HOST: process.env.HOST ?? "localhost",            // opcional
  CORS_ORIGIN: parseOrigins(process.env.CORS_ORIGIN),
  JWT_SECRET: process.env.JWT_SECRET ?? "change_me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "15m",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
};

export const isProd = env.NODE_ENV === "production";
