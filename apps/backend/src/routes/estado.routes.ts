import { Router } from "express";
import { getEstados } from "../controllers/estado.controller.js";

const router = Router();

// GET /api/estados
router.get("/", getEstados);

export default router;
