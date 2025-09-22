import crypto from "crypto";

export function generateRT(): string {
  return crypto.randomBytes(64).toString("base64url"); // largo y URL-safe
}

export function hashRT(rt: string): string {
  return crypto.createHash("sha256").update(rt).digest("hex"); // determinístico para lookup
}
