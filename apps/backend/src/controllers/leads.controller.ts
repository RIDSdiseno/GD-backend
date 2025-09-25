import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";

/* =========================
   Helpers
========================= */

function parseIntParam(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function parseDateParam(v: any): Date | undefined {
  if (!v) return undefined;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? undefined : d;
}

function parsePagination(query: any) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  return { page, pageSize, skip, take };
}

/** Convierte número/strings a Decimal o null/undefined según corresponda */
function toDecimal(input: any): Prisma.Decimal | null | undefined {
  if (input === undefined) return undefined; // "no tocar"
  if (input === null || input === "") return null; // poner null
  const n = typeof input === "number" ? input : Number(String(input).replace(",", "."));
  if (!Number.isFinite(n)) return undefined;
  return new Prisma.Decimal(n);
}

/* ===== Resolver IDs por nombre, sin genéricos y sin props undefined ===== */
type RepoConNombre = {
  findFirst(args: { where: { nombre: string } }): Promise<{ id: number } | null>;
};

function buildParams(id?: number, nombre?: string | null) {
  const o: { id?: number; nombre?: string | null } = {};
  if (typeof id === "number") o.id = id;
  if (nombre) o.nombre = nombre;
  return o;
}

/** Resuelve ID por nombre (si no envían ID). Requiere que `nombre` sea unique. */
async function resolveIdByNombre(
  repo: RepoConNombre,
  params: { id?: number; nombre?: string | null }
): Promise<number | null> {
  if (typeof params.id === "number") return params.id;
  if (!params.nombre) return null;
  const found = await repo.findFirst({ where: { nombre: params.nombre } });
  return found?.id ?? null;
}

const leadInclude = {
  marca: true,
  categoria: true,
  tipoCliente: true,
  comuna: true,
  estado: true,
  segmentacion: true,
  usuario: { select: { id: true, nombreUsuario: true, email: true } },
} as const;

/* =========================
   Controllers
========================= */

/** GET /api/leads  */
export const listLeads = async (req: Request, res: Response) => {
  try {
    const { skip, take, page, pageSize } = parsePagination(req.query);

    const q = typeof req.query.q === "string" ? req.query.q : "";
    const estadoId = parseIntParam(req.query.estadoId);
    const marcaId = parseIntParam(req.query.marcaId);
    const usuarioId = parseIntParam(req.query.usuarioId);
    const categoriaId = parseIntParam(req.query.categoriaId);
    const tipoClienteId = parseIntParam(req.query.tipoClienteId);
    const segmentacionId = parseIntParam(req.query.segmentacionId);

    const desde = parseDateParam(req.query.desde);
    const hasta = parseDateParam(req.query.hasta);

    const orderByField = String(req.query.orderBy ?? "updatedAt");
    const orderDir: "asc" | "desc" =
      String(req.query.orderDir ?? "desc") === "asc" ? "asc" : "desc";

    // Construimos dinámicamente sin meter propiedades undefined
    const and: Prisma.LeadWhereInput[] = [];

    if (q) {
      and.push({
        OR: [
          { nombreCliente: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { telefono: { contains: q, mode: "insensitive" } },
          { codigoCliente: { contains: q, mode: "insensitive" } },
          { nroCotizacion: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    if (estadoId) and.push({ estadoId });
    if (marcaId) and.push({ marcaId });
    if (usuarioId) and.push({ usuarioId });
    if (categoriaId) and.push({ categoriaId });
    if (tipoClienteId) and.push({ tipoClienteId });
    if (segmentacionId) and.push({ segmentacionId });

    if (desde || hasta) {
      const dateFilter: Prisma.DateTimeNullableFilter = {};
      if (desde) dateFilter.gte = desde;
      if (hasta) dateFilter.lte = hasta;
      and.push({ fechaIngreso: dateFilter });
    }

    const where: Prisma.LeadWhereInput = and.length ? { AND: and } : {};

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take,
        orderBy: { [orderByField]: orderDir } as any,
        include: leadInclude,
      }),
      prisma.lead.count({ where }),
    ]);

    return res.json({ page, pageSize, total, leads });
  } catch (error) {
    console.error("listLeads error:", error);
    return res
      .status(500)
      .json({ error: "Error interno del servidor al listar leads" });
  }
};

/** GET /api/leads/:id */
export const getLead = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Parámetro id inválido" });

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: leadInclude,
    });

    if (!lead) return res.status(404).json({ error: "Lead no encontrado" });
    return res.json({ lead });
  } catch (error) {
    console.error("getLead error:", error);
    return res.status(500).json({ error: "Error interno del servidor al obtener lead" });
  }
};

/** POST /api/leads */
export const createLead = async (req: Request, res: Response) => {
  try {
    const p = req.body ?? {};

    // Validaciones mínimas
    if (!p.codigoCliente) {
      return res.status(400).json({ error: "codigoCliente es requerido" });
    }
    if (!p.nombreCliente) {
      return res.status(400).json({ error: "nombreCliente es requerido" });
    }

    // Defaults de catálogos si no mandan nada
    const DEFAULT_ESTADO = "Pendiente";
    const DEFAULT_SEGMENTACION = "Sin Clasificar";

    // Armar params sin props undefined
    const marcaParams        = buildParams(p.marcaId,        p.marcaNombre ?? null);
    const categoriaParams    = buildParams(p.categoriaId,    p.categoriaNombre ?? null);
    const tipoClienteParams  = buildParams(p.tipoClienteId,  p.tipoClienteNombre ?? null);
    const comunaParams       = buildParams(p.comunaId,       p.comunaNombre ?? null);

    const estadoParams       = buildParams(p.estadoId,       p.estadoNombre ?? null);
    if (estadoParams.id === undefined && !estadoParams.nombre) {
      estadoParams.nombre = DEFAULT_ESTADO; // fallback
    }

    const segmentacionParams = buildParams(p.segmentacionId, p.segmentacionNombre ?? null);
    if (segmentacionParams.id === undefined && !segmentacionParams.nombre) {
      segmentacionParams.nombre = DEFAULT_SEGMENTACION; // fallback
    }

    const [
      marcaId,
      categoriaId,
      tipoClienteId,
      comunaId,
      estadoId,
      segmentacionId,
    ] = await Promise.all([
      resolveIdByNombre(prisma.marca,        marcaParams),
      resolveIdByNombre(prisma.categoria,    categoriaParams),
      resolveIdByNombre(prisma.tipoCliente,  tipoClienteParams),
      resolveIdByNombre(prisma.comuna,       comunaParams),
      resolveIdByNombre(prisma.estado,       estadoParams),
      resolveIdByNombre(prisma.segmentacion, segmentacionParams),
    ]);

    const created = await prisma.lead.create({
      data: {
        codigoCliente: String(p.codigoCliente),
        fechaIngreso: p.fechaIngreso ? new Date(p.fechaIngreso) : null,

        marcaId: marcaId ?? null,
        nombreCliente: String(p.nombreCliente),
        categoriaId: categoriaId ?? null,

        tipoClienteId: tipoClienteId ?? null,
        plataforma: p.plataforma ?? null,

        fechaEvento: p.fechaEvento ? new Date(p.fechaEvento) : null,
        dia: p.dia ?? null,
        mes: p.mes ?? null,
        semana: p.semana ?? null,
        anio: p.anio ?? null,

        comunaId: comunaId ?? null,
        telefono: p.telefono ?? null,
        conversar: p.conversar ?? null,
        email: p.email ?? null,
        montoCotizado: toDecimal(p.montoCotizado) ?? null,

        estadoId: estadoId ?? null,
        ultimoCambio: p.ultimoCambio ? new Date(p.ultimoCambio) : new Date(),

        seguimiento1: p.seguimiento1 ?? null,
        fechaSeguimiento: p.fechaSeguimiento ? new Date(p.fechaSeguimiento) : null,
        motivoEvento: p.motivoEvento ?? null,

        nroCotizacion: p.nroCotizacion ?? null,

        usuarioId: p.usuarioId ?? null,
        segmentacionId: segmentacionId ?? null,
      },
      include: leadInclude,
    });

    return res.status(201).json({ lead: created });
  } catch (error: any) {
    console.error("createLead error:", error);
    if (error?.code === "P2002") {
      // unique violation (codigoCliente o nroCotizacion)
      return res.status(409).json({ error: "Duplicado: código de cliente o nroCotizacion ya existen" });
    }
    if (error?.code === "P2003") {
      return res.status(400).json({ error: "Clave foránea inválida en alguno de los catálogos" });
    }
    return res.status(500).json({ error: "Error interno del servidor al crear lead" });
  }
};


/** PATCH /api/leads/:id */
export const updateLead = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Parámetro id inválido" });

    const p = req.body ?? {};

    const [
      marcaId,
      categoriaId,
      tipoClienteId,
      comunaId,
      estadoId,
      segmentacionId,
    ] = await Promise.all([
      resolveIdByNombre(prisma.marca,        buildParams(p.marcaId,        p.marcaNombre ?? null)),
      resolveIdByNombre(prisma.categoria,    buildParams(p.categoriaId,    p.categoriaNombre ?? null)),
      resolveIdByNombre(prisma.tipoCliente,  buildParams(p.tipoClienteId,  p.tipoClienteNombre ?? null)),
      resolveIdByNombre(prisma.comuna,       buildParams(p.comunaId,       p.comunaNombre ?? null)),
      resolveIdByNombre(prisma.estado,       buildParams(p.estadoId,       p.estadoNombre ?? null)),
      resolveIdByNombre(prisma.segmentacion, buildParams(p.segmentacionId, p.segmentacionNombre ?? null)),
    ]);

    const data: Prisma.LeadUpdateInput = {
      ...(p.codigoCliente !== undefined && { codigoCliente: String(p.codigoCliente) }),
      ...(p.fechaIngreso !== undefined && { fechaIngreso: p.fechaIngreso ? new Date(p.fechaIngreso) : null }),

      ...(p.nombreCliente !== undefined && { nombreCliente: String(p.nombreCliente) }),
      ...(marcaId !== null && marcaId !== undefined && { marcaId }),
      ...(categoriaId !== null && categoriaId !== undefined && { categoriaId }),

      ...(tipoClienteId !== null && tipoClienteId !== undefined && { tipoClienteId }),
      ...(p.plataforma !== undefined && { plataforma: p.plataforma }),

      ...(p.fechaEvento !== undefined && { fechaEvento: p.fechaEvento ? new Date(p.fechaEvento) : null }),
      ...(p.dia !== undefined && { dia: p.dia }),
      ...(p.mes !== undefined && { mes: p.mes }),
      ...(p.semana !== undefined && { semana: p.semana }),
      ...(p.anio !== undefined && { anio: p.anio }),

      ...(comunaId !== null && comunaId !== undefined && { comunaId }),
      ...(p.telefono !== undefined && { telefono: p.telefono }),
      ...(p.conversar !== undefined && { conversar: p.conversar }),
      ...(p.email !== undefined && { email: p.email }),
      ...(toDecimal(p.montoCotizado) !== undefined && { montoCotizado: toDecimal(p.montoCotizado) as any }),

      ...(estadoId !== null && estadoId !== undefined && { estadoId }),
      ...(p.ultimoCambio !== undefined && { ultimoCambio: p.ultimoCambio ? new Date(p.ultimoCambio) : new Date() }),

      ...(p.seguimiento1 !== undefined && { seguimiento1: p.seguimiento1 }),
      ...(p.fechaSeguimiento !== undefined && { fechaSeguimiento: p.fechaSeguimiento ? new Date(p.fechaSeguimiento) : null }),
      ...(p.motivoEvento !== undefined && { motivoEvento: p.motivoEvento }),

      ...(p.nroCotizacion !== undefined && { nroCotizacion: p.nroCotizacion }),

      ...(p.usuarioId !== undefined && { usuarioId: p.usuarioId }),
      ...(segmentacionId !== null && segmentacionId !== undefined && { segmentacionId }),
    };

    const updated = await prisma.lead.update({
      where: { id },
      data,
      include: leadInclude,
    });

    return res.json({ lead: updated });
  } catch (error: any) {
    console.error("updateLead error:", error);
    if (error?.code === "P2002") {
      return res.status(409).json({ error: "Duplicado: código de cliente o nroCotizacion ya existen" });
    }
    if (error?.code === "P2025") {
      return res.status(404).json({ error: "Lead no encontrado" });
    }
    if (error?.code === "P2003") {
      return res.status(400).json({ error: "Clave foránea inválida en alguno de los catálogos" });
    }
    return res.status(500).json({ error: "Error interno del servidor al actualizar lead" });
  }
};

/** DELETE /api/leads/:id */
export const deleteLead = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Parámetro id inválido" });

    await prisma.lead.delete({ where: { id } });
    return res.json({ ok: true });
  } catch (error: any) {
    console.error("deleteLead error:", error);
    if (error?.code === "P2025") {
      return res.status(404).json({ error: "Lead no encontrado" });
    }
    return res.status(500).json({ error: "Error interno del servidor al eliminar lead" });
  }
};

/** PATCH /api/leads/:id/estado */
export const changeEstado = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Parámetro id inválido" });

    const estadoId = typeof req.body.estadoId === "number" ? req.body.estadoId : undefined;
    const estadoNombre: string | undefined =
      typeof req.body.estadoNombre === "string" ? req.body.estadoNombre : undefined;

    const resolvedEstadoId = await resolveIdByNombre(
      prisma.estado,
      buildParams(estadoId, estadoNombre ?? null)
    );
    if (!resolvedEstadoId) {
      return res.status(400).json({ error: "estadoId o estadoNombre requerido" });
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: { estadoId: resolvedEstadoId, ultimoCambio: new Date() },
      include: { estado: true },
    });

    return res.json({ lead });
  } catch (error: any) {
    console.error("changeEstado error:", error);
    if (error?.code === "P2025") return res.status(404).json({ error: "Lead no encontrado" });
    return res.status(500).json({ error: "Error interno del servidor al cambiar estado" });
  }
};

/** PATCH /api/leads/:id/asignar */
export const assignLead = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Parámetro id inválido" });

    const usuarioId = parseIntParam(req.body.usuarioId);
    if (!usuarioId) return res.status(400).json({ error: "usuarioId requerido" });

    const lead = await prisma.lead.update({
      where: { id },
      data: { usuarioId, ultimoCambio: new Date() },
      include: { usuario: { select: { id: true, nombreUsuario: true, email: true } } },
    });

    return res.json({ lead });
  } catch (error: any) {
    console.error("assignLead error:", error);
    if (error?.code === "P2025") return res.status(404).json({ error: "Lead no encontrado" });
    if (error?.code === "P2003") return res.status(400).json({ error: "usuarioId inválido" });
    return res.status(500).json({ error: "Error interno del servidor al asignar lead" });
  }
};
