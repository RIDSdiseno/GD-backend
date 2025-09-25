import { Router } from "express";
import { getComunas } from "../controllers/comuna.controller.js";

const router = Router();

// GET /api/comunas
router.get("/", getComunas);

export default router;
