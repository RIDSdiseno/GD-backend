import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertMarca(nombre: string) {
  return prisma.marca.upsert({
    where: { nombre },
    update: {},
    create: { nombre },
    select: { id: true },
  });
}

async function seedAdmin(nombreUsuario: string, email: string, plainPassword: string) {
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  // Marca por defecto
  const marca = await upsertMarca("CMR");

  const user = await prisma.usuario.upsert({
    where: { email },
    update: {}, // no actualiza si ya existe
    create: {
      nombreUsuario,
      email,
      passwordHash,
      nivel: "ADMIN",
      status: true,
      marcaId: marca.id,
    },
    select: { id: true, email: true, nivel: true },
  });

  console.log("✅ Usuario admin listo:", user);
}

async function main() {
  await seedAdmin("Administrador", "admin@cmr.test", "123456");
  await seedAdmin("Admin RIDS", "prueba@rids.cl", "Wpdd8sNm60a9rzwNHRfe");
}

