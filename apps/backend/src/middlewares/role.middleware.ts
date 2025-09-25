// src/middlewares/role.middleware.ts
import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { Nivel } from "../lib/jwt.js";

/**
 * Extiende el tipo Request para incluir "user".
 * Esto depende de cómo lo agregues en authGuard.
 */
interface AuthenticatedRequest extends Request {
  user?: {
    nivel?: Nivel;
    [key: string]: any;
  };
}

/**
 * Middleware de autorización por rol.
 * Uso:
 *   requireRole("ADMIN")
 *   requireRole("ADMIN", "SUB_ADMIN")
 *   requireRole(["ADMIN", "SUB_ADMIN"])
 */
export function requireRole(...roles: (Nivel | Nivel[])[]): RequestHandler {
  // Normaliza a un array plano de roles
  const allowed: Nivel[] = roles.flat();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const nivel = req.user?.nivel;

    if (!nivel || !allowed.includes(nivel)) {
      return res.status(403).json({ error: "No autorizado" });
    }

    return next();
  };
}
