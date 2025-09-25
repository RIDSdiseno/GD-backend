import { Router } from "express";
import { getCategorias } from "../controllers/categoria.controller.js";

const router = Router();

// GET /api/categorias
router.get("/", getCategorias);

export default router;
