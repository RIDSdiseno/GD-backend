// src/routes.ts
import { Router } from "express";
import authRoutes from "./routes/auth.route.js";


const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true, service: "API CMR", ts: Date.now() }));

router.use("/auth", authRoutes);

export default router;
