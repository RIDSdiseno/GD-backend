// src/routes.ts
import { Router } from "express";
import authRoutes from "./routes/auth.route.js";
import usuariosRoutes from "./routes/usuarios.routes.js"; // 👈 importa tu router de usuarios

const router = Router();

router.get("/health", (_req, res) =>
  res.json({ ok: true, service: "API CMR", ts: Date.now() })
);

router.use("/auth", authRoutes);

// ✅ usuarios: dos alias válidos
router.use("/users", usuariosRoutes);
router.use("/usuarios", usuariosRoutes);

export default router;
