import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Middleware para autorizar solo ciertos roles (por ejemplo: "ADMIN", "SUB_ADMIN")
 */
export const authorizeRoles = (...rolesPermitidos: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const nivel = req.user?.nivel;

    if (!nivel || !rolesPermitidos.includes(nivel)) {
      return res.status(403).json({ error: "Acceso denegado: rol insuficiente" });
    }

    return next();
  };
};
