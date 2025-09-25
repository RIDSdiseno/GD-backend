import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

type JwtUser = {
  sub: string;        // id de usuario
  role?: string;      // rol si lo incluyes en el token
  email?: string;
};

export const authGuard: RequestHandler = (req, res, next) => {
  const auth = req.header("authorization");

  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No autorizado: token requerido" });
  }

  const token = auth.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtUser;

    // adjunta el usuario al request para middlewares siguientes
    (req as any).user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    };

    return next(); // ✅ siempre retornamos
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};
