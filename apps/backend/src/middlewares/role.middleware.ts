// src/middlewares/role.middleware.ts
import type { Request, Response, NextFunction } from "express";
import type { Nivel } from "../lib/jwt.js";

/**
 * Middleware de autorización por rol.
 * Ejemplo: requireRole(["ADMIN", "SUB_ADMIN"])
 */
export function requireRole(roles: Nivel[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const nivel = req.user?.nivel;
    if (!nivel || !roles.includes(nivel)) {
      return res.status(403).json({ error: "No autorizado" });
    }
    next();
  };
}
