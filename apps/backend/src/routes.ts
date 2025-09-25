// src/routes.ts
import { Router } from "express";
import authRoutes from "./routes/auth.route.js";
import usuariosRoutes from "./routes/usuarios.routes.js";
import comunasRoutes from "./routes/comunas.routes.js";
import categoriasRoutes from "./routes/categorias.routes.js";
import tipoClienteRoutes from "./routes/tipo-cliente.routes.js";
import marcasRoutes from "./routes/marcas.routes.js";
import estadoRoutes from "./routes/estado.routes.js";
import segmentacionRoutes from "./routes/segmentacion.routes.js"
import leadsRoutes from"./routes/leads.routes.js"

const router = Router();

// ✅ health check
router.get("/health", (_req, res) =>
  res.json({ ok: true, service: "API CMR", ts: Date.now() })
);


router.use("/auth", authRoutes);

router.use("/users", usuariosRoutes);
router.use("/usuarios", usuariosRoutes);
router.use("/comunas", comunasRoutes);
router.use("/categorias",categoriasRoutes);
router.use("/tipo-cliente",tipoClienteRoutes);
router.use("/marcas", marcasRoutes);
router.use("/estados", estadoRoutes);
router.use("/segmentacion", segmentacionRoutes);
router.use("/leads", leadsRoutes);


export default router;
