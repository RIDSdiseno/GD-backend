import express from "express";
import cors, { type CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes.js";
import { env } from "./config/env.js";

const app = express();
app.set("trust proxy", 1);

// --- LOG para diagnosticar CORS (quítalo luego)
app.use((req, _res, next) => {
  if (req.method === "OPTIONS" || req.path === "/health") {
    console.log("CORS preflight / health:", {
      origin: req.headers.origin,
      method: req.method,
      path: req.path,
    });
  }
  next();
});

// --- Lista final de orígenes permitidos
const allowedOrigins: string[] = env.CORS_ORIGIN ?? [];
// Si quieres permitir previews de Netlify, añade este patrón cuando confirmemos:
// e.g. https://deploy-preview-123--crmgdiamond.netlify.app (ver más abajo)

const corsOptions: CorsOptions = {
  origin(origin, cb) {
    // Permitir requests sin Origin (healthchecks, curl, Postman)
    if (!origin) return cb(null, true);

    // match exacto del origin
    if (allowedOrigins.includes(origin)) return cb(null, true);

    // (opcional) permitir previews de Netlify:
    // if (/^https:\/\/deploy-preview-\d+--crmgdiamond\.netlify\.app$/.test(origin)) {
    //   return cb(null, true);
    // }

    return cb(new Error(`CORS bloqueado para origen: ${origin}`));
  },
  credentials: true, // true si usas cookies httpOnly; si NO usas cookies, puedes dejar false
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600,
};

app.use(cors(corsOptions));
// Express 5: usar "(.*)" para catch-all OPTIONS (no "*")
app.options("(.*)", cors(corsOptions));

app.use(cookieParser());
app.use(express.json());

app.get("/health", (_req, res) =>
  res.json({ ok: true, env: env.NODE_ENV, origins: allowedOrigins })
);

// OJO: todo cuelga de /api
app.use("/api", routes);

export default app;
