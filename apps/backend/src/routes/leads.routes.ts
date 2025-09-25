import { Router } from "express";
import {
  listLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  changeEstado,
  assignLead,
} from "../controllers/leads.controller.js";

const router = Router();

// /api/leads
router.get("/", listLeads);
router.get("/:id", getLead);
router.post("/", createLead);
router.patch("/:id", updateLead);
router.delete("/:id", deleteLead);
router.patch("/:id/estado", changeEstado);
router.patch("/:id/asignar", assignLead);

export default router;
