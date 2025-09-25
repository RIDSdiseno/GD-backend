import express from "express";
import cors, { type CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes.js";
import { env } from "./config/env.js"; // asegúrate que esta ruta exista tras compilar

const app = express();

// Detrás de proxy (Render/NGINX/Heroku)
app.set("trust proxy", 1);

// --- CORS: ya tienes CORS_ORIGIN como string[]
const allowedOrigins: string[] = env.CORS_ORIGIN ?? [];

// Si usas cookies HTTP-only, deja credentials: true.
// Si NO usas cookies y sólo usas Authorization: Bearer, puedes poner credentials: false.
const corsOptions: CorsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // healthchecks / curl sin Origin
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS bloqueado para origen: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600,
};

app.use(cors(corsOptions));
// Responder explícitamente preflights
app.options("*", cors(corsOptions));

// --- Parsers
app.use(cookieParser());
app.use(express.json());

// --- Health
app.get("/health", (_req, res) =>
  res.json({ ok: true, env: env.NODE_ENV, origins: allowedOrigins })
);

// --- Rutas API (todo cuelga de /api)
app.use("/api", routes);

export default app;
