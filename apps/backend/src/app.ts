// app.ts
import express, { type RequestHandler } from "express";
import cors, { type CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes.js";
import { env } from "./config/env.js";

const app = express();
app.set("trust proxy", 1);

// Orígenes permitidos (ya string[])
const allowedOrigins = (env.CORS_ORIGIN ?? [])
  .map(o => o.trim().replace(/\/$/, "")) // sin trailing slash
  .filter(Boolean);

console.log("CORS allowed origins:", allowedOrigins);

// CORS options con returns explícitos (TS7030-safe)
const corsOptions: CorsOptions = {
  origin(origin, cb) {
    if (!origin) { cb(null, true); return; }
    const norm = origin.replace(/\/$/, "");
    if (allowedOrigins.includes(norm)) { cb(null, true); return; }

    // (opcional) permitir deploy previews de Netlify
    // if (/^https:\/\/deploy-preview-\d+--crmgdiamond\.netlify\.app$/.test(norm)) { cb(null, true); return; }

    cb(new Error(`CORS bloqueado para origen: ${origin}`)); return;
  },
  credentials: true, // déjalo true solo si usas cookies httpOnly
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600,
};

app.use(cors(corsOptions));

// Preflight handler tipado y con returns (TS7030-safe)
const handlePreflight: RequestHandler = (req, res, next) => {
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  return next();
};
app.use(handlePreflight);

app.use(cookieParser());
app.use(express.json());

// Health
app.get("/health", (_req, res) =>
  res.json({ ok: true, env: env.NODE_ENV, origins: allowedOrigins })
);

// API
app.use("/api", routes);

app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("💥 Error:", {
    path: req.path,
    method: req.method,
    origin: req.headers.origin,
    message: err?.message,
    stack: err?.stack,
    code: err?.code,           // Prisma codes (P100x, P2002, etc)
    name: err?.name,
  });

  const status = err?.status ?? 500;
  res.status(status).json({
    message: err?.message ?? "Internal Server Error",
    code: err?.code ?? "INTERNAL_ERROR",
  });
});

export default app;
