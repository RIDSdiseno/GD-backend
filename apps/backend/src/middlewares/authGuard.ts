// src/middlewares/authGuard.ts
import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

type JwtUser = {
  sub?: string;          // id de usuario
  id?: string | number;  // por si usaste otra claim
  userId?: string | number;
  role?: string;         // "ADMIN" | "USER"...
  nivel?: string;        // también soporta 'nivel'
  email?: string;
};

export const authGuard: RequestHandler = (req, res, next) => {
  // 1) Token desde Authorization o cookie httpOnly
  const bearer = req.header("authorization");
  const cookieToken = (req as any).cookies?.token; // requiere cookie-parser
  const token = bearer?.startsWith("Bearer ") ? bearer.slice(7) : cookieToken;

  if (!token) {
    return res.status(401).json({ message: "No autorizado: token requerido" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtUser;

    // 2) Normaliza id y nivel/rol
    const userId = String(payload.sub ?? payload.id ?? payload.userId ?? "");
    const nivel = String(payload.nivel ?? payload.role ?? "").toUpperCase() || undefined;

    // 3) Adjunta al request para middlewares siguientes
    (req as any).user = {
      id: userId,
      email: payload.email,
      nivel,        // <- usado por requireRole
      role: nivel,  // <- alias por compatibilidad
    };

    return next();
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};
