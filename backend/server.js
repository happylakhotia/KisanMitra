import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./src/routes/auth.js";
import userRoutes from "./src/routes/user.js";
import predictRoutes from "./src/routes/predict.js";
import pestRoutes from "./src/routes/pest.js";
import fieldRoutes from "./src/routes/field.js";
import aiRoutes from "./src/routes/ai.js";
import reportRoutes from "./src/routes/report.js";
import { analyzeNDVI } from "./src/controllers/ndvi.controller.js";

dotenv.config();

const app = express();

/* -------------------- CORS CONFIG (VERCEL SAFE) -------------------- */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://kisan-mitra-frontend.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

console.log("🔐 Allowed CORS origins:", allowedOrigins);

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log("✅ CORS allowed for:", origin);
      return callback(null, true);
    }

    console.error("❌ CORS blocked origin:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Apply CORS middleware BEFORE routes
app.use(cors(corsOptions));

// Explicitly handle OPTIONS requests for all routes
app.options("*", cors(corsOptions));

/* -------------------- MIDDLEWARE -------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------- ROUTES -------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/disease", predictRoutes);
app.use("/api/pest", pestRoutes);
app.use("/api/field", fieldRoutes);   // ✅ fixed path
app.use("/api/ai", aiRoutes);
app.use("/api/report", reportRoutes);

app.post("/api/analyze-ndvi", analyzeNDVI);

/* -------------------- HEALTH CHECK -------------------- */
app.get("/", (req, res) => {
  res.json({ message: "AgriVision API is running 🚀" });
});

// Lightweight health check endpoint for cold start prevention
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

/* -------------------- ERROR HANDLER -------------------- */
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

/* -------------------- START SERVER (LOCAL DEV) -------------------- */
const PORT = process.env.PORT || 5000;

// Only start server if not in serverless environment (Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

/* -------------------- EXPORT (FOR VERCEL) -------------------- */
export default app;
