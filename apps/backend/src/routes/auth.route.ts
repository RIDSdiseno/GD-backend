// src/routes.ts
import { Router } from "express";
import {
  login, register, refresh, logout, me, deleteUser
} from "../controllers/auth.controller.js";
import { authGuard } from "../middlewares/authGuard.js";

const r = Router();

r.get("/health", (_req, res) => res.json({ ok: true, service: "API CMR", ts: Date.now() }));

// Auth
r.post("/register", register);
r.post("/login", login);
r.post("/refresh", refresh);    // ← sin authGuard (valida cookie)
r.post("/logout", logout);
r.get("/me", authGuard, me);    // ← protegido con Access Token
r.delete("/auth/user/:id", authGuard, deleteUser);

export default r;
