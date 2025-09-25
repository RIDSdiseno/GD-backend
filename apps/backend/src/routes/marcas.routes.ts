import { Router } from "express";
import { getMarcas } from "../controllers/marcas.controller.js";

const router = Router();

// GET /api/marcas
router.get("/", getMarcas);

export default router;
