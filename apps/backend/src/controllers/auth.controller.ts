// src/controllers/auth.controller.ts
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import {
  signAccessToken,
  generateRT,
  hashRT,
  addDays,
  parseRemember,
  toNivel,
  type JwtPayload,
} from "../lib/jwt.js";
import { setRefreshCookie, clearRefreshCookie } from "../utils/cookies.js";

const REFRESH_DAYS = Number(process.env.REFRESH_DAYS ?? 7);
const REFRESH_REMEMBER_DAYS = Number(process.env.REFRESH_REMEMBER_DAYS ?? 60);

/* =========================
   POST /auth/register
========================= */
export const register = async (req: Request, res: Response) => {
  try {
    const { nombreUsuario, email, password, nivel } = req.body;
    if (!nombreUsuario || !email || !password || !nivel) {
      return res
        .status(400)
        .json({ error: "Nombre, correo, contraseña y nivel son obligatorios" });
    }

    const emailNorm = String(email).trim().toLowerCase();
    const existing = await prisma.usuario.findUnique({
      where: { email: emailNorm },
    });
    if (existing) return res.status(409).json({ error: "Usuario ya existe" });

    const passwordHash = await bcrypt.hash(password, 10);

    // valida y normaliza nivel
    const nivelSeguro = toNivel(nivel);

    const newUser = await prisma.usuario.create({
      data: {
        nombreUsuario,
        email: emailNorm,
        passwordHash,
        nivel: nivelSeguro,
        status: true,
      },
      select: { id: true, nombreUsuario: true, email: true, nivel: true },
    });

    return res.status(201).json({ user: newUser });
  } catch (e) {
    console.error("register error:", e);
    return res.status(500).json({ error: "Error interno" });
  }
};

/* =========================
   POST /auth/login
========================= */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, remember } = req.body as {
      email?: string;
      password?: string;
      remember?: boolean;
    };
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Correo y contraseña son obligatorios" });
    }

    const emailNorm = email.trim().toLowerCase();
    const user = await prisma.usuario.findUnique({
      where: { email: emailNorm },
      select: {
        id: true,
        nombreUsuario: true,
        email: true,
        passwordHash: true,
        nivel: true,
        status: true,
      },
    });

    if (!user || !user.status) {
      await bcrypt.compare(
        password,
        "$2b$10$invalidinvalidinvalidinvalidinv12345678901234567890"
      );
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

    // normaliza nivel
    const nivel = toNivel(user.nivel);
    const isAdmin = nivel === "ADMIN";

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      nivel,
      isAdmin,
      nombreUsuario: user.nombreUsuario,
    };

    const at = signAccessToken(payload);

    const rememberFlag = Boolean(remember);
    const days = rememberFlag ? REFRESH_REMEMBER_DAYS : REFRESH_DAYS;

    const rt = generateRT();
    const rtDigest = hashRT(rt);
    const userAgent: string | null = req.get("user-agent") ?? null;
    const ip: string | null = (req.ip ?? req.socket?.remoteAddress ?? null) as
      | string
      | null;

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        rtHash: rtDigest,
        expiresAt: addDays(days),
        userAgent,
        ip,
      },
    });

    setRefreshCookie(res, rt, days);

    const { passwordHash, ...safeUser } = user;
    return res.json({ token: at, user: { ...safeUser, isAdmin }, remember: rememberFlag });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ error: "Error interno" });
  }
};

/* =========================
   POST /auth/refresh
========================= */
export const refresh = async (req: Request, res: Response) => {
  try {
    const rt = req.cookies?.rt as string | undefined;
    if (!rt) return res.status(401).json({ error: "Sin refresh token" });

    const digest = hashRT(rt);
    const row = await prisma.refreshToken.findFirst({
      where: { rtHash: digest },
      include: { user: true },
    });

    if (!row) {
      clearRefreshCookie(res);
      return res.status(401).json({ error: "Refresh inválido" });
    }
    if (row.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { userId: row.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      clearRefreshCookie(res);
      return res.status(401).json({ error: "Refresh revocado" });
    }
    if (row.expiresAt.getTime() <= Date.now()) {
      clearRefreshCookie(res);
      return res.status(401).json({ error: "Refresh expirado" });
    }
    if (!row.user.status) {
      await prisma.refreshToken.update({
        where: { id: row.id },
        data: { revokedAt: new Date() },
      });
      clearRefreshCookie(res);
      return res.status(403).json({ error: "Usuario deshabilitado" });
    }

    const rememberParam = parseRemember(req.query.remember);
    const days = rememberParam ? REFRESH_REMEMBER_DAYS : REFRESH_DAYS;

    const newRt = generateRT();
    const newDigest = hashRT(newRt);
    const ua: string | null = req.get("user-agent") ?? null;
    const ipAddr: string | null = (req.ip ?? req.socket?.remoteAddress ?? null) as
      | string
      | null;

    await prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: row.id },
        data: { revokedAt: new Date() },
      });
      await tx.refreshToken.create({
        data: {
          userId: row.userId,
          rtHash: newDigest,
          expiresAt: addDays(days),
          userAgent: ua,
          ip: ipAddr,
          replacedByTokenId: row.id,
        },
      });
    });

    setRefreshCookie(res, newRt, days);

    // normaliza nivel
    const nivel = toNivel(row.user.nivel);
    const isAdmin = nivel === "ADMIN";

    const payload: JwtPayload = {
      id: row.user.id,
      email: row.user.email,
      nivel,
      isAdmin,
      nombreUsuario: row.user.nombreUsuario,
    };

    const at = signAccessToken(payload);

    return res.json({ token: at, remember: rememberParam });
  } catch (e) {
    console.error("refresh error:", e);
    clearRefreshCookie(res);
    return res.status(401).json({ error: "Refresh inválido" });
  }
};

/* =========================
   POST /auth/logout
========================= */
export const logout = async (req: Request, res: Response) => {
  try {
    const rt = req.cookies?.rt as string | undefined;
    if (rt) {
      const digest = hashRT(rt);
      const row = await prisma.refreshToken.findFirst({ where: { rtHash: digest } });
      if (row && !row.revokedAt) {
        await prisma.refreshToken.update({
          where: { id: row.id },
          data: { revokedAt: new Date() },
        });
      }
    }
    clearRefreshCookie(res);
    return res.json({ ok: true });
  } catch (error) {
    console.error("logout error:", error);
    return res.status(500).json({ error: "Error interno" });
  }
};
