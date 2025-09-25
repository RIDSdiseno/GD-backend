import { Router } from "express";
import { getTiposCliente } from "../controllers/tipo-cliente.controller.js";

const router = Router();

// GET /api/tipo-cliente
router.get("/", getTiposCliente);

export default router;
