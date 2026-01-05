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
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      console.log("REQUEST ORIGIN:", origin);
      console.log("ALLOWED:", process.env.FRONTEND_URL);

      if (!origin) return callback(null, true);

      if (origin === process.env.FRONTEND_URL) {
        return callback(null, true);
      }

      return callback(null, true); // TEMP: allow all to confirm
    },
    credentials: true,
  })
);


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

/* -------------------- ERROR HANDLER -------------------- */
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

/* -------------------- EXPORT (NO app.listen) -------------------- */
export default app;
