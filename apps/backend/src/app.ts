import express from "express";
import cors, { type CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes.js"; // 👈 tu archivo routes.ts compila a routes.js
import { env } from "./config/env.js";

const app = express();

// Si usas proxy/NGINX/Vercel/Render
app.set("trust proxy", 1);

// —— CORS con lista desde .env (CORS_ORIGIN puede tener varios, separados por coma)
const corsOptions: CorsOptions = {
  origin(origin, cb) {
    // Permite healthchecks/curl sin Origin y valida los orígenes configurados
    if (!origin) return cb(null, true);
    if (env.CORS_ORIGIN.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS bloqueado para origen: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600,
};
app.use(cors(corsOptions));
// (opcional, pero útil para algunos clientes)

// —— Parsers
app.use(cookieParser());
app.use(express.json());

// —— Health
app.get("/health", (_req, res) => res.json({ ok: true, env: env.NODE_ENV }));

// —— Rutas de la API
app.use("/api", routes);

export default app;
