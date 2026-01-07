import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";

const router = express.Router();
const upload = multer();

router.post("/predict", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    console.log("Pest prediction request received");

    const HF_URL = process.env.HF_PEST_URL || "https://Happy-1234-pest-2-happy.hf.space/predict-pest";

    // Use form-data package (works reliably on Vercel)
    const formData = new FormData();
    formData.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    console.log(`📡 Sending to: ${HF_URL}`);

    // Single attempt with 55 second timeout (Vercel Pro: 60s max, Hobby: 10s max)
    const response = await axios.post(HF_URL, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 55000, // 55 seconds - works on Vercel Pro plan
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log("✅ Pest prediction successful");
    res.json(response.data);

  } catch (error) {
    console.error("❌ Pest prediction error:", error.message);
    
    // Check if it's a timeout
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return res.status(504).json({ 
        error: "Model is taking too long to respond",
        details: "The AI model may be cold starting. Please try again in 10-15 seconds.",
        code: "TIMEOUT"
      });
    }
    
    // Check if it's a connection error
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({ 
        error: "Cannot connect to AI model",
        details: "The Hugging Face Space may be sleeping or unavailable.",
        code: "CONNECTION_ERROR"
      });
    }
    
    res.status(500).json({ 
      error: "Failed to predict pest",
      details: error.response?.data?.error || error.message,
      suggestion: "The AI model may be starting up. Please try again in a few seconds."
    });
  }
});

export default router;
