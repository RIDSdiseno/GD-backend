// src/middlewares/role.middleware.ts
import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { Nivel } from "../lib/jwt.js";

/** Request con user inyectado por authGuard */
interface AuthenticatedRequest extends Request {
  user?: {
    id?: string | number;
    email?: string;
    nivel?: string | Nivel; // puede venir como string o como enum
    role?: string;          // alias por compatibilidad
    [key: string]: any;
  };
}

/** Normaliza cualquier valor a MAYÚSCULAS para comparar */
const normalize = (v: unknown) => String(v ?? "").trim().toUpperCase();

/**
 * Middleware de autorización por rol.
 * Uso:
 *   requireRole("ADMIN")
 *   requireRole("ADMIN", "SUB_ADMIN")
 *   requireRole(["ADMIN", "SUB_ADMIN"])
 */
export function requireRole(
  ...roles: Array<Nivel | string | Array<Nivel | string>>
): RequestHandler {
  // aplanar y normalizar la lista de roles permitidos
  const allowed: string[] = roles.flat().map(normalize).filter(Boolean);

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const rawNivel = req.user?.nivel ?? req.user?.role;

    if (!rawNivel) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const nivel = normalize(rawNivel);

    if (!allowed.includes(nivel)) {
      return res.status(403).json({ error: "Acceso denegado" });
    }

    return next();
  };
}
