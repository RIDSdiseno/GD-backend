// src/server.ts
import http from "http";
import app from "./app.js";              // 👈 tu app Express
import { prisma } from "./lib/prisma.js";

const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? "localhost";

// Crear servidor HTTP
const server: http.Server = app.listen(PORT, HOST, () => {
  console.log(`🚀 API escuchando en http://${HOST}:${PORT}`);
});

// ==== Helpers de cierre limpio ====
async function shutdown(signal: string) {
  console.log(`\n🟡 Recibida señal ${signal}, cerrando servidor...`);
  try {
    await prisma.$disconnect();
    console.log("🔌 Prisma desconectado");
  } catch (err) {
    console.error("❌ Error al desconectar Prisma:", err);
  }

  server.close(() => {
    console.log("✅ Servidor cerrado correctamente");
    process.exit(0);
  });

  // Forzar salida si tarda > 10s
  setTimeout(() => {
    console.error("⏰ Forzando cierre por timeout");
    process.exit(1);
  }, 10_000).unref();
}

// ==== Captura de señales ====
["SIGINT", "SIGTERM"].forEach((sig) =>
  process.on(sig, () => void shutdown(sig))
);

// ==== Manejo de errores globales ====
process.on("uncaughtException", (err) => {
  console.error("💥 uncaughtException:", err);
  void shutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  console.error("💥 unhandledRejection:", reason);
  void shutdown("unhandledRejection");
});
