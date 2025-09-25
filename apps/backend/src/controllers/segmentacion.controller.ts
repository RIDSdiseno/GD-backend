import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const getSegmentaciones = async (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(2000, Math.max(1, limitRaw))
      : 500;

    const where = q
      ? { nombre: { contains: q, mode: "insensitive" as const } }
      : {};

    const segmentaciones = await prisma.segmentacion.findMany({
      where,
      orderBy: { nombre: "asc" },
      take: limit,
      select: { id: true, nombre: true },
    });

    return res.json({ segmentaciones });
  } catch (error) {
    console.error("getSegmentaciones error:", error);
    return res
      .status(500)
      .json({ error: "Error interno del servidor al obtener segmentaciones" });
  }
};
