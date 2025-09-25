// app.ts
import express from "express";
import cors, { type CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes.js";
import { env } from "./config/env.js"; // exporta CORS_ORIGIN como string[]

const app = express();
app.set("trust proxy", 1);

// --- allowed origins (string[])
const allowedOrigins = (env.CORS_ORIGIN ?? [])
  .map(o => o.trim().replace(/\/$/, "")) // sin trailing slash
  .filter(Boolean);

// DEBUG (quítalo luego)
console.log("CORS allowed origins:", allowedOrigins);

// --- CORS
const corsOptions: CorsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // healthchecks/curl/Postman
    const norm = origin.replace(/\/$/, "");
    if (allowedOrigins.includes(norm)) return cb(null, true);

    // opcional: permitir deploy previews de Netlify
    if (/^https:\/\/deploy-preview-\d+--crmgdiamond\.netlify\.app$/.test(norm)) {
      return cb(null, true);
    }

    return cb(new Error(`CORS bloqueado para origen: ${origin}`));
  },
  credentials: true, // déjalo true solo si usas cookies httpOnly
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600,
};

app.use(cors(corsOptions));

// ✅ Express 5: el comodín debe iniciar con "/"
app.options("/(.*)", cors(corsOptions));

app.use(cookieParser());
app.use(express.json());

// Health
app.get("/health", (_req, res) =>
  res.json({ ok: true, env: env.NODE_ENV, origins: allowedOrigins })
);

// API
app.use("/api", routes);

export default app;
