// src/types/express.d.ts  (o al inicio de tu middleware, pero evita duplicarlo en otro archivo)
import "express";
import type { JwtPayload } from "../lib/jwt";

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload;
    token?: string;
  }
}
