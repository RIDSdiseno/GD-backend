// src/middleware/auth.middleware.ts
import type { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET, toNivel, type DecodedAny, type JwtPayload } from "../lib/jwt.js";

if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET no está definido en variables de entorno");
  process.exit(1);
}

export const authGuard: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No autenticado (falta token)" });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedAny;

    // Normaliza y valida tipos
    const nivel = toNivel(decoded.nivel);
    const payload: JwtPayload = {
      id: Number(decoded.id),
      email: String(decoded.email),
      nivel,
      isAdmin: Boolean(decoded.isAdmin ?? (nivel === "ADMIN")),
      nombreUsuario: String(decoded.nombreUsuario ?? ""),
    };

    req.user = payload;
    req.token = token;
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: "Sesión expirada, refresca el token" });
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Token inválido" });
    }
    return res.status(401).json({ error: "No autorizado" });
  }
};

export const authGuardOptional: RequestHandler = (req, _res, next) => {
  const authHeader = req.headers?.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as DecodedAny;
      const nivel = toNivel(decoded.nivel);
      req.user = {
        id: Number(decoded.id),
        email: String(decoded.email),
        nivel,
        isAdmin: Boolean(decoded.isAdmin ?? (nivel === "ADMIN")),
        nombreUsuario: String(decoded.nombreUsuario ?? ""),
      };
      req.token = token;
    } catch {
      // anónimo si falla
    }
  }
  return next();
};
