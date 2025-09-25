import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

// GET /users/me
export const me = async (req: Request, res: Response) => {
  const userId = Number(req.user?.id);
  if (!Number.isFinite(userId)) return res.status(400).json({ error: "Token inválido (id no numérico)" });

  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { id: true, nombreUsuario: true, email: true, nivel: true, status: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
  return res.json({ user: { ...user, isAdmin: user.nivel === "ADMIN" } });
};

// POST /users
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { nombreUsuario, email, password, nivel } = req.body;
    if (!nombreUsuario || !email || !password || !nivel) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    // Permisos: SUB_ADMIN no crea ADMIN/SUB_ADMIN; USER no crea
    if (req.user?.nivel === "USER") return res.status(403).json({ error: "No autorizado" });
    if (req.user?.nivel === "SUB_ADMIN" && ["ADMIN", "SUB_ADMIN"].includes(String(nivel).toUpperCase())) {
      return res.status(403).json({ error: "No puedes crear usuarios con mayor nivel" });
    }

    const emailNorm = String(email).trim().toLowerCase();
    const existing = await prisma.usuario.findUnique({ where: { email: emailNorm } });
    if (existing) return res.status(409).json({ error: "Usuario ya existe" });

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.usuario.create({
      data: { nombreUsuario, email: emailNorm, passwordHash, nivel: (String(nivel).toUpperCase() as any), status: true },
      select: { id: true, nombreUsuario: true, email: true, nivel: true, status: true },
    });

    return res.status(201).json({ user: newUser });
  } catch (error) {
    console.error("RegisterUser error:", error);
    return res.status(500).json({ error: "Error interno" });
  }
};

// GET /users
export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    let where: any = {};
    if (_req.user?.nivel === "USER") where = { id: _req.user.id };
    else if (_req.user?.nivel === "SUB_ADMIN") where = { nivel: "USER" };

    const users = await prisma.usuario.findMany({
      where,
      select: { id: true, nombreUsuario: true, email: true, nivel: true, status: true },
      orderBy: { id: "asc" },
    });
    return res.json({ users });
  } catch (error) {
    console.error("getAllUsers error:", error);
    return res.status(500).json({ error: "Error interno del servidor al obtener usuarios" });
  }
};

// PUT /users/:id
export const updateUsers = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombreUsuario, email, nivel, status } = req.body;

  try {
    const user = await prisma.usuario.findUnique({ where: { id: Number(id) } });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    if (req.user?.nivel === "SUB_ADMIN" && (user.nivel === "ADMIN" || user.nivel === "SUB_ADMIN")) {
      return res.status(403).json({ error: "No tienes permiso para editar este usuario" });
    }

    const updated = await prisma.usuario.update({
      where: { id: Number(id) },
      data: {
        ...(nombreUsuario && { nombreUsuario }),
        ...(email && { email }),
        ...(nivel && { nivel }),
        ...(status !== undefined && { status }),
      },
      select: { id: true, nombreUsuario: true, email: true, nivel: true, status: true },
    });
    return res.json({ user: updated });
  } catch (error) {
    console.error("updateUsers error:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// DELETE /users/:id
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const current = req.user!;
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId)) return res.status(400).json({ error: "ID inválido" });

    const target = await prisma.usuario.findUnique({ where: { id: userId } });
    if (!target) return res.status(404).json({ error: "Usuario no encontrado" });

    if (current.nivel === "USER") return res.status(403).json({ error: "No tienes permiso para eliminar usuarios" });
    if (current.nivel === "SUB_ADMIN" && target.nivel === "ADMIN") {
      return res.status(403).json({ error: "No puedes eliminar usuarios ADMIN" });
    }

    await prisma.usuario.delete({ where: { id: userId } });
    return res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("deleteUser error:", error);
    return res.status(500).json({ error: "Error interno" });
  }
};
