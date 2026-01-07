import express from "express";
import multer from "multer";

const router = express.Router();
const upload = multer();

// Retry helper for HuggingFace cold starts
async function fetchWithRetry(url, options, maxRetries = 3, timeout = 50000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} to fetch ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

router.post("/predict", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    console.log("Disease prediction request received");
    
    // Native FormData + Blob (Node 18+)
    const formData = new FormData();
    formData.append("file", new Blob([req.file.buffer]), req.file.originalname);

    const HF_URL = process.env.HF_DISEASE_URL || "https://Happy-1234-dis-32-happy.hf.space/predict";
    
    // Use retry logic with 50s timeout per attempt
    const response = await fetchWithRetry(HF_URL, {
      method: "POST",
      body: formData
    }, 3, 50000);

    const data = await response.json();
    console.log("Disease prediction successful");
    res.json(data);

  } catch (error) {
    console.error("Disease prediction error:", error.message);
    res.status(500).json({ 
      error: "Failed to predict disease",
      details: error.message,
      suggestion: "The AI model may be starting up. Please try again in a few seconds."
    });
  }
});

export default router;
