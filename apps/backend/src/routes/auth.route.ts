// src/routes.ts
import { Router } from "express";
import {
  login, register, refresh, logout, me, deleteUser,
  registerUser,
  getAllUsers,
  updateUsers
} from "../controllers/auth.controller.js";
import { authGuard } from "../middlewares/authGuard.js";
import { authorizeRoles } from '../middlewares/role.middleware.js';


const r = Router();

r.get("/health", (_req, res) => res.json({ ok: true, service: "API CMR", ts: Date.now() }));

// Auth 
r.post("/register", register);
r.post("/registerUser",registerUser)
r.post("/login", login);
r.post("/refresh", refresh);    // ← sin authGuard (valida cookie)
r.post("/logout", logout);
r.get("/me", authGuard, me);    // ← protegido con Access Token
r.delete("/user/:id", authGuard, deleteUser);
r.get("/usuarios",authGuard,authorizeRoles("ADMIN","SUB_ADMIN"),getAllUsers) // ← protegido con access token y roles autorizados
r.put("/usuarios/:id",updateUsers) // ← protegido con access token y roles autorizados

export default r;
