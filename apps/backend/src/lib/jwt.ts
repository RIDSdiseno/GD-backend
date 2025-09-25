import jwt, { type Secret } from "jsonwebtoken";
import crypto from "crypto";

/* ====================================
   TIPOS
==================================== */

export type Nivel = "ADMIN" | "SUB_ADMIN" | "USER";

export type JwtPayload = {
  id: number;
  email: string;
  nivel: Nivel;             // unión literal ✅
  isAdmin: boolean;
  nombreUsuario: string;
  iat?: number;
  exp?: number;
};

// payload dinámico que devuelve jwt.verify
export type DecodedAny = jwt.JwtPayload & Record<string, unknown>;

/* ====================================
   CONFIG
==================================== */

export const JWT_SECRET: Secret = process.env.JWT_SECRET ?? "dev_secret";
export const ACCESS_EXPIRES_SEC = Number(
  process.env.JWT_ACCESS_EXPIRES_SECONDS ?? 15 * 60
);

/* ====================================
   HELPERS
==================================== */

export function signAccessToken(
  payload: JwtPayload,
  expiresInSec = ACCESS_EXPIRES_SEC
) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresInSec });
}

export function generateRT(): string {
  return crypto.randomBytes(64).toString("base64url");
}

export function hashRT(rt: string): string {
  return crypto.createHash("sha256").update(rt).digest("hex");
}

export function addDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export function parseRemember(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v.toLowerCase() === "true";
  return false;
}

/**
 * Type guard para transformar unknown -> Nivel (lanza si es inválido)
 */
export function toNivel(x: unknown): Nivel {
  if (x === "ADMIN" || x === "SUB_ADMIN" || x === "USER") return x;
  throw new Error("nivel inválido en JWT");
}

/**
 * Normaliza un objeto suelto a JwtPayload estricto.
 * Útil si reconstruyes el payload desde DB u otras fuentes.
 */
export function toJwtPayload(raw: Record<string, unknown>): JwtPayload {
  const nivel = toNivel(raw.nivel);

  const base = {
    id: Number(raw.id),
    email: String(raw.email),
    nivel,
    isAdmin: Boolean(raw.isAdmin ?? (nivel === "ADMIN")),
    nombreUsuario: String(raw.nombreUsuario ?? ""),
  } satisfies Omit<JwtPayload, "iat" | "exp">;

  return {
    ...base,
    ...(typeof raw.iat === "number" ? { iat: raw.iat } : {}),
    ...(typeof raw.exp === "number" ? { exp: raw.exp } : {}),
  };
}


/**
 * Verifica el Access Token y devuelve un JwtPayload ESTRICTO.
 * Lanza TokenExpiredError / JsonWebTokenError si corresponde.
 */
export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as DecodedAny;
  return toJwtPayload(decoded);
}
