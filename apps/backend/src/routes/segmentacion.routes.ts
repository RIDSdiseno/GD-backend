import { Router } from "express";
import { getSegmentaciones } from "../controllers/segmentacion.controller.js";

const router = Router();

// GET /api/segmentacion
router.get("/", getSegmentaciones);

export default router;
