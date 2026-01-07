import PDFDocument from 'pdfkit';
import { db } from '../config/firebase.js';
import axios from 'axios';
import FormData from 'form-data';

const CLIENT_ID = "2869324a-556d-47ef-8a86-51d6afa72823";
const CLIENT_SECRET = "Dwwx2LD2ZAqBktucTUIF5QmeksgItyw3";
const AI_BASE_URL = process.env.HF_REPORT_INDICES_URL || "https://Happy-1234-indexes-2all.hf.space";

// Index descriptions for the report
const INDEX_DESCRIPTIONS = {
  NDVI: {
    title: "NDVI (Normalized Difference Vegetation Index)",
    description: "Measures vegetation health and density. Higher values (green) indicate healthy, dense vegetation. Lower values (red/orange) indicate stressed or sparse vegetation.",
    interpretation: {
      healthy: { range: "> 0.40", meaning: "Excellent health - Dense, thriving vegetation with optimal chlorophyll levels" },
      good: { range: "0.25 - 0.40", meaning: "Good health - Healthy vegetation with adequate nutrient uptake" },
      moderate: { range: "0.15 - 0.25", meaning: "Moderate stress - Check for water or nutrient deficiency" },
      poor: { range: "< 0.15", meaning: "High stress/Bare soil - Immediate attention recommended" }
    }
  },
  SAVI: {
    title: "SAVI (Soil Adjusted Vegetation Index)",
    description: "Similar to NDVI but adjusted for soil brightness. Better for areas with sparse vegetation or exposed soil.",
    interpretation: {
      healthy: { range: "> 0.40", meaning: "Dense vegetation with minimal soil influence" },
      good: { range: "0.25 - 0.40", meaning: "Good vegetation cover" },
      moderate: { range: "0.15 - 0.25", meaning: "Moderate vegetation with visible soil" },
      poor: { range: "< 0.15", meaning: "Sparse vegetation or bare soil" }
    }
  },
  EVI: {
    title: "EVI (Enhanced Vegetation Index)",
    description: "Optimized for high biomass regions. Better at detecting vegetation in dense canopy areas.",
    interpretation: {
      healthy: { range: "> 0.50", meaning: "Very dense canopy with high biomass" },
      good: { range: "0.35 - 0.50", meaning: "Good canopy development" },
      moderate: { range: "0.20 - 0.35", meaning: "Moderate vegetation density" },
      poor: { range: "< 0.20", meaning: "Sparse vegetation" }
    }
  },
  NDRE: {
    title: "NDRE (Normalized Difference Red Edge)",
    description: "Sensitive to chlorophyll content and crop growth stages. Useful for monitoring crop maturity.",
    interpretation: {
      maturity: { range: "> 0.22", meaning: "Maturity/flowering stage - Monitor for harvest" },
      active: { range: "0.12 - 0.22", meaning: "Active growth with high chlorophyll" },
      early: { range: "0.02 - 0.12", meaning: "Early vegetative stage" },
      dormant: { range: "< 0.02", meaning: "Dormant or bare soil" }
    }
  }
};


// Detailed chart descriptions matching Analytics page
const CHART_DESCRIPTIONS = {
  soilMoistureRainfall: {
    title: "Soil Moisture vs Rainfall Analysis",
    description: "This chart shows the relationship between rainfall events (blue bars) and soil moisture levels (blue line). When rainfall occurs, soil moisture increases. During dry periods, moisture decreases due to evapotranspiration. Optimal soil moisture for most crops is 40-70%. Values below 30% indicate drought stress, while values above 80% may cause waterlogging issues.",
    insight: "Use this to plan irrigation - irrigate when moisture drops below 40% and no rain is forecasted."
  },
  vpdTemperature: {
    title: "Water Stress (VPD) & Temperature",
    description: "VPD (Vapor Pressure Deficit) measures atmospheric dryness and plant water stress. The orange area shows VPD levels, while the red line tracks maximum temperature. VPD above 1.5 kPa (marked by red dashed line) indicates high water stress where plants struggle to maintain proper transpiration. High temperatures combined with high VPD accelerate crop stress.",
    insight: "Days with VPD > 1.5 kPa require increased irrigation or shade protection for sensitive crops."
  },
  healthIndices: {
    title: "Crop Health Indices Comparison",
    description: "This multi-line chart compares four vegetation indices over time:\n• NDVI (green): Overall vegetation health and chlorophyll content\n• EVI (blue dashed): Enhanced index for dense canopy areas\n• NDRE (purple dashed): Nitrogen status and growth stage indicator\n• SAVI (yellow): Soil-adjusted vegetation measurement\nAll indices range from 0 to 1, with higher values indicating healthier vegetation.",
    insight: "Compare indices to identify specific issues - diverging NDVI and NDRE may indicate nitrogen deficiency."
  },
  diseaseGrowth: {
    title: "Disease Risk & Growth Tracking",
    description: "This chart combines disease risk factors with crop growth progress. Blue bars show leaf wetness hours - prolonged wetness (>10 hours, marked by red line) creates favorable conditions for fungal diseases. The orange line tracks Cumulative Growing Degree Days (GDD), which measures heat accumulation for crop development stages.",
    insight: "High leaf wetness + moderate temperatures (15-25 C) = highest fungal disease risk. Consider preventive fungicide application."
  },
};


// Helper: Get Sentinel Token
async function getSentinelToken() {
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  const response = await axios.post('https://services.sentinel-hub.com/oauth/token', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return response.data.access_token;
}

// Helper: Get BBox
function getBBox(lat, lng, radiusKm) {
  const lat_degree_km = 111.0;
  const lng_degree_km = 111.0 * Math.cos(lat * (Math.PI / 180));
  const r_lat = (radiusKm / 2) / lat_degree_km;
  const r_lng = (radiusKm / 2) / lng_degree_km;
  return [lng - r_lng, lat - r_lat, lng + r_lng, lat + r_lat];
}

// Helper: Fetch heatmap for a given index type
async function fetchHeatmap(lat, lng, indexType, radius) {
  try {
    const token = await getSentinelToken();
    
    // UPDATED EVALSCRIPT - Now fetches 6 bands (includes B11 for SAVI)
    // Must match the evalscript in ndvi.controller.js
    const evalscript = `
      //VERSION=3
      function setup() {
        return {
          input: [{ 
            bands: ["B02", "B03", "B04", "B05", "B08", "B11"], 
            units: "DN" 
          }],
          output: { 
            bands: 6, 
            sampleType: "UINT16" 
          }
        };
      }

      function evaluatePixel(sample) { 
        // Index 0: Blue (B02)
        // Index 1: Green (B03)
        // Index 2: Red (B04)
        // Index 3: Red Edge (B05)
        // Index 4: NIR (B08)
        // Index 5: SWIR (B11) - Required for SAVI
        return [sample.B02, sample.B03, sample.B04, sample.B05, sample.B08, sample.B11]; 
      }
    `;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 60);

    const bbox = getBBox(lat, lng, radius || 1.0);
    
    console.log(`📡 Fetching ${indexType} heatmap for report...`);
    
    const sentinelResponse = await axios.post('https://services.sentinel-hub.com/api/v1/process', {
      input: {
        bounds: { bbox, properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" } },
        data: [{ type: "sentinel-2-l1c", dataFilter: { timeRange: { from: startDate.toISOString(), to: endDate.toISOString() }, mosaickingOrder: "leastCC" } }]
      },
      output: { width: 256, height: 256, responses: [{ identifier: "default", format: { type: "image/tiff" } }] },
      evalscript
    }, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'image/tiff' },
      responseType: 'arraybuffer',
      timeout: 30000 // 30 second timeout for Sentinel API
    });

    const form = new FormData();
    form.append('file', Buffer.from(sentinelResponse.data), { filename: 'sentinel_6band.tiff' });
    
    const aiResponse = await axios.post(`${AI_BASE_URL}/predict?model_type=${indexType.toLowerCase()}`, form, { 
      headers: { ...form.getHeaders() },
      timeout: 55000, // 55 seconds for Vercel Pro
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log(`✅ ${indexType} heatmap fetched successfully`);
    return { success: true, heatmap_base64: aiResponse.data.heatmap_base64, statistics: aiResponse.data.statistics };
  } catch (error) {
    console.error(`❌ Error fetching ${indexType} heatmap:`, error.message);
    return null;
  }
}


export const generateReport = async (req, res) => {
  try {
    const userId = req.user?.uid || req.body.userId;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });
    const userData = userDoc.data();

    const fieldsSnapshot = await db.collection('users').doc(userId).collection('fields').get();
    const fields = [];
    fieldsSnapshot.forEach(doc => fields.push({ id: doc.id, ...doc.data() }));
    if (fields.length === 0) return res.status(400).json({ error: "No fields found" });

    let selectedField = fields.find(f => f.id === req.body.fieldId) || fields[0];
    const { lat: fieldLat, lng: fieldLng, radius: fieldRadius = 1.0 } = selectedField;
    if (!fieldLat || !fieldLng) return res.status(400).json({ error: "Field coordinates not found" });

    // Fetch analytics data
    let analyticsData = null;
    try {
      const resp = await axios.post(process.env.HF_ANALYTICS_DATA_URL || "https://happy-1234-collectdata-happy.hf.space/generate_data", {
        lat: fieldLat, lon: fieldLng, field_name: selectedField.fieldName || "Field_1"
      }, {
        timeout: 55000, // 55 seconds for Vercel Pro
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      analyticsData = resp.data;
    } catch (e) { console.error("Analytics fetch error:", e.message); }

    // Fetch heatmaps
    const heatmaps = {};
    for (const idx of ['NDVI', 'NDRE', 'EVI', 'SAVI']) {
      const data = await fetchHeatmap(fieldLat, fieldLng, idx, fieldRadius);
      if (data) heatmaps[idx] = data;
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="agrivision-report-${Date.now()}.pdf"`);
    doc.pipe(res);

    // Helper functions
    const addHeader = (text, y, size = 14) => {
      doc.fontSize(size).fillColor('#16a34a').font('Helvetica-Bold').text(text, 50, y).font('Helvetica').fillColor('#000');
      return y + size + 6;
    };

    const addSubHeader = (text, y) => {
      doc.fontSize(11).fillColor('#374151').font('Helvetica-Bold').text(text, 50, y).font('Helvetica');
      return y + 16;
    };

    const drawLineChart = (data, yKey, x, y, w, h, color, label, yMin, yMax, drawAxes = true) => {
      const values = data.map(d => d[yKey]).filter(v => !isNaN(v) && isFinite(v));
      if (values.length < 2) return;

      const minV = yMin !== undefined ? yMin : Math.min(...values);
      const maxV = yMax !== undefined ? yMax : Math.max(...values);
      const range = maxV - minV || 1;

      // Axes (only draw if drawAxes is true)
      if (drawAxes) {
        doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(x, y).lineTo(x, y + h).lineTo(x + w, y + h).stroke();
        doc.fontSize(7).fillColor('#6b7280').text(maxV.toFixed(1), x - 25, y - 3).text(minV.toFixed(1), x - 25, y + h - 5);
      }

      // Line
      doc.strokeColor(color).lineWidth(2);
      let first = true;
      data.forEach((pt, i) => {
        const v = pt[yKey];
        if (isNaN(v) || !isFinite(v)) return;
        const px = x + (i / (data.length - 1)) * w;
        const py = y + h - ((v - minV) / range) * h;
        if (first) { doc.moveTo(px, py); first = false; } else doc.lineTo(px, py);
      });
      doc.stroke();

      // Label
      if (label) doc.fontSize(8).fillColor(color).text(label, x + w - 80, y - 12);
    };

    // Draw line on right Y-axis (for dual axis charts)
    const drawLineChartRightAxis = (data, yKey, x, y, w, h, color, yMin, yMax) => {
      const values = data.map(d => d[yKey]).filter(v => !isNaN(v) && isFinite(v));
      if (values.length < 2) return;

      const minV = yMin !== undefined ? yMin : Math.min(...values);
      const maxV = yMax !== undefined ? yMax : Math.max(...values);
      const range = maxV - minV || 1;

      // Right Y-axis labels
      doc.fontSize(7).fillColor('#6b7280').text(maxV.toFixed(0), x + w + 5, y - 3).text(minV.toFixed(0), x + w + 5, y + h - 5);

      // Line
      doc.strokeColor(color).lineWidth(2);
      let first = true;
      data.forEach((pt, i) => {
        const v = pt[yKey];
        if (isNaN(v) || !isFinite(v)) return;
        const px = x + (i / (data.length - 1)) * w;
        const py = y + h - ((v - minV) / range) * h;
        if (first) { doc.moveTo(px, py); first = false; } else doc.lineTo(px, py);
      });
      doc.stroke();
    };

    const drawBarChart = (data, yKey, x, y, w, h, color, yMax) => {
      const values = data.map(d => d[yKey]).filter(v => !isNaN(v) && isFinite(v));
      if (values.length < 2) return;
      const maxV = yMax !== undefined ? yMax : Math.max(...values) || 1;
      const barW = Math.max(2, Math.floor(w / data.length) - 1);

      data.forEach((pt, i) => {
        const v = pt[yKey] || 0;
        const barH = (v / maxV) * h;
        const px = x + (i / data.length) * w;
        doc.rect(px, y + h - barH, barW, barH).fillColor(color).fill();
      });
    };

    // Draw area chart (filled area under line) - like VPD in Analytics
    const drawAreaChart = (data, yKey, x, y, w, h, strokeColor, fillColor, yMin, yMax) => {
      const values = data.map(d => d[yKey]).filter(v => !isNaN(v) && isFinite(v));
      if (values.length < 2) return;

      const minV = yMin !== undefined ? yMin : 0;
      const maxV = yMax !== undefined ? yMax : Math.max(...values);
      const range = maxV - minV || 1;

      // Draw axes
      doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(x, y).lineTo(x, y + h).lineTo(x + w, y + h).stroke();
      doc.fontSize(7).fillColor('#6b7280').text(maxV.toFixed(1), x - 25, y - 3).text(minV.toFixed(1), x - 25, y + h - 5);

      // Build path for filled area
      const points = [];
      data.forEach((pt, i) => {
        const v = pt[yKey];
        if (isNaN(v) || !isFinite(v)) return;
        const px = x + (i / (data.length - 1)) * w;
        const py = y + h - ((v - minV) / range) * h;
        points.push({ x: px, y: py });
      });

      if (points.length < 2) return;

      // Draw filled area
      doc.moveTo(points[0].x, y + h);
      points.forEach(p => doc.lineTo(p.x, p.y));
      doc.lineTo(points[points.length - 1].x, y + h);
      doc.fillColor(fillColor).fill();

      // Draw stroke line on top
      doc.strokeColor(strokeColor).lineWidth(2);
      doc.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach(p => doc.lineTo(p.x, p.y));
      doc.stroke();
    };


    // Get field map image
    const getFieldMapImage = async () => {
      try {
        if (!selectedField.coordinates?.length) return null;
        const lats = selectedField.coordinates.map(c => c.lat || c[1]);
        const lngs = selectedField.coordinates.map(c => c.lng || c[0]);
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        const path = selectedField.coordinates.map(c => `${c.lat || c[1]},${c.lng || c[0]}`).join('|');
        const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=15&size=600x400&maptype=satellite&path=color:0x00FF00|weight:3|fillcolor:0x00FF0080|${path}&key=AIzaSyDKR_CVLRbV0lqjy_8JRWZAVDdO5Xl7jRk`;
        const resp = await axios.get(mapUrl, { responseType: 'arraybuffer' });
        return Buffer.from(resp.data);
      } catch (e) { return null; }
    };

    // ==================== PAGE 1: COVER ====================
    let yPos = 50;
    doc.rect(220, yPos, 100, 100).fillColor('#16a34a').fill();
    doc.fillColor('#fff').fontSize(36).text('AV', 245, yPos + 32);
    yPos += 120;

    doc.fontSize(28).fillColor('#16a34a').text('AgriVision', 50, yPos, { align: 'center' });
    doc.fontSize(16).fillColor('#374151').text('Comprehensive Field Analysis Report', 50, yPos + 35, { align: 'center' });
    yPos += 80;

    doc.fontSize(12).fillColor('#6b7280')
      .text(`Field: ${selectedField.fieldName || 'N/A'}`, 50, yPos, { align: 'center' })
      .text(`Crop: ${selectedField.cropName || 'N/A'}`, 50, yPos + 18, { align: 'center' })
      .text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 50, yPos + 36, { align: 'center' });
    yPos += 80;

    // Farmer & Field Info Box
    doc.rect(50, yPos, 495, 120).fillColor('#f0fdf4').fill();
    doc.fontSize(12).fillColor('#166534').font('Helvetica-Bold').text('Report Summary', 70, yPos + 15).font('Helvetica');
    doc.fontSize(10).fillColor('#374151')
      .text(`Farmer: ${userData.firstName || ''} ${userData.lastName || ''}`, 70, yPos + 38)
      .text(`Email: ${userData.email || 'N/A'}`, 300, yPos + 38)
      .text(`Phone: ${userData.phone || 'N/A'}`, 70, yPos + 55)
      .text(`Farm Address: ${userData.farmAddress || 'N/A'}`, 300, yPos + 55)
      .text(`Field Area: ${selectedField.area || 'N/A'}`, 70, yPos + 72)
      .text(`Sowing Date: ${selectedField.sowingDate || 'N/A'}`, 300, yPos + 72)
      .text(`Coordinates: ${fieldLat.toFixed(5)}, ${fieldLng.toFixed(5)}`, 70, yPos + 89);
    yPos += 140;

    // Field Map
    yPos = addHeader('Field Location', yPos);
    const mapImg = await getFieldMapImage();
    if (mapImg) {
      doc.image(mapImg, 50, yPos, { width: 495, height: 250 });
      yPos += 260;
      doc.fontSize(8).fillColor('#6b7280').text('Satellite imagery showing field boundary (green outline)', 50, yPos);
    } else {
      doc.fontSize(10).fillColor('#9ca3af').text('Field map not available', 50, yPos);
    }


    // ==================== PAGE 2-3: HEAT MAPS ====================
    doc.addPage();
    yPos = 40;
    doc.fontSize(22).fillColor('#16a34a').text('Vegetation Index Heat Maps', 50, yPos, { align: 'center' });
    doc.fontSize(10).fillColor('#6b7280').text('Satellite-based crop health analysis from Sentinel-2 imagery', 50, yPos + 28, { align: 'center' });
    yPos += 60;

    for (const indexType of Object.keys(heatmaps)) {
      if (yPos > 520) { doc.addPage(); yPos = 40; }

      const hm = heatmaps[indexType];
      const info = INDEX_DESCRIPTIONS[indexType];

      // Title & Description
      doc.fontSize(13).fillColor('#16a34a').font('Helvetica-Bold').text(info.title, 50, yPos).font('Helvetica');
      yPos += 18;
      doc.fontSize(9).fillColor('#4b5563').text(info.description, 50, yPos, { width: 495 });
      yPos += 35;

      if (hm?.heatmap_base64) {
        // Image
        const imgBuf = Buffer.from(hm.heatmap_base64, 'base64');
        doc.image(imgBuf, 50, yPos, { width: 180, height: 135 });

        // Stats
        let sx = 250, sy = yPos;
        doc.fontSize(10).fillColor('#16a34a').font('Helvetica-Bold').text('Analysis Results:', sx, sy).font('Helvetica');
        sy += 16;
        if (hm.statistics) {
          const maxKey = Object.entries(hm.statistics).reduce((a, b) => b[1] > a[1] ? b : a, ['', 0])[0];
          Object.entries(hm.statistics).forEach(([k, v]) => {
            const isMax = k === maxKey;
            doc.fontSize(9).fillColor(isMax ? '#16a34a' : '#374151')
              .text(`• ${k}: ${v.toFixed(1)}%${isMax ? ' (Dominant)' : ''}`, sx, sy);
            sy += 13;
          });
        }

        // Interpretation
        sy += 8;
        doc.fontSize(9).fillColor('#1f2937').font('Helvetica-Bold').text('Value Interpretation:', sx, sy).font('Helvetica');
        sy += 14;
        Object.values(info.interpretation).forEach(int => {
          doc.fontSize(8).fillColor('#6b7280').text(`${int.range}: ${int.meaning}`, sx, sy, { width: 280 });
          sy += 11;
        });

        yPos += 150;
      } else {
        doc.fontSize(9).fillColor('#9ca3af').text('Heatmap data not available', 50, yPos);
        yPos += 20;
      }

      // Separator
      doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, yPos).lineTo(545, yPos).stroke();
      yPos += 15;
    }


    // ==================== PAGE 4-5: ANALYTICS CHARTS ====================
    doc.addPage();
    yPos = 40;
    doc.fontSize(22).fillColor('#16a34a').text('Weather & Crop Analytics', 50, yPos, { align: 'center' });
    doc.fontSize(10).fillColor('#6b7280').text('Historical data analysis for precision farming decisions', 50, yPos + 28, { align: 'center' });
    yPos += 60;

    // Process analytics data
    let processedData = [];
    if (analyticsData && typeof analyticsData === 'string') {
      const lines = analyticsData.trim().split("\n");
      const headers = lines[0].split(",");
      const rawData = lines.slice(1).map(line => {
        const vals = line.split(",");
        const obj = {};
        headers.forEach((h, i) => { obj[h.trim()] = isNaN(vals[i]) ? vals[i] : parseFloat(vals[i]); });
        return obj;
      });

      let moisture = 50;
      processedData = rawData.map((d, i) => {
        if (d.precipitation > 0) moisture += d.precipitation * 2;
        else moisture -= (d.vpd * 0.8) + 0.5;
        moisture = Math.max(10, Math.min(90, moisture));

        // Smoothed NDVI
        let ndvi_smooth = d.ndvi;
        if (i >= 3 && i < rawData.length - 3) {
          let sum = 0;
          for (let j = -3; j <= 3; j++) sum += rawData[i + j].ndvi || 0;
          ndvi_smooth = sum / 7;
        }

        return { ...d, soil_moisture: d.soil_moisture || moisture, ndvi_smooth, cum_gdd: (i > 0 ? rawData[i - 1].cum_gdd || 0 : 0) + (d.gdd || 0) };
      });
    }

    if (processedData.length > 0) {
      const avgNDVI = processedData.reduce((s, d) => s + (d.ndvi || 0), 0) / processedData.length;
      const totalRain = processedData.reduce((s, d) => s + (d.precipitation || 0), 0);
      const avgTemp = processedData.reduce((s, d) => s + (d.temperature || d.temperature_max || 0), 0) / processedData.length;
      const stressDays = processedData.filter(d => d.vpd > 1.5).length;
      const diseaseDays = processedData.filter(d => (d.leaf_wetness_hours || 0) > 10).length;

      // KPI Summary Box
      doc.rect(50, yPos, 495, 65).fillColor('#f0fdf4').fill();
      doc.fontSize(10).fillColor('#166534').font('Helvetica-Bold').text('Key Performance Indicators', 60, yPos + 8).font('Helvetica');
      doc.fontSize(9).fillColor('#374151')
        .text(`Avg NDVI: ${avgNDVI.toFixed(3)}`, 60, yPos + 28)
        .text(`Total Rain: ${totalRain.toFixed(1)} mm`, 180, yPos + 28)
        .text(`Avg Temp: ${avgTemp.toFixed(1)} C`, 300, yPos + 28)
        .text(`Stress Days: ${stressDays}`, 420, yPos + 28)
        .text(`Disease Risk: ${diseaseDays} days`, 60, yPos + 45)
        .text(`Data Points: ${processedData.length}`, 180, yPos + 45);
      yPos += 80;

      // Use all data like Analytics page does (full 6 months)
      const chartData = processedData;
      const chartW = 400, chartH = 140;

      // Calculate dynamic ranges for all charts based on actual data
      const vpdValues = chartData.map(d => d.vpd || 0).filter(v => !isNaN(v) && isFinite(v));
      const tempValues = chartData.map(d => d.temperature_max || 0).filter(v => !isNaN(v) && isFinite(v));
      const gddValues = chartData.map(d => d.cum_gdd || 0).filter(v => !isNaN(v) && isFinite(v));
      const wetValues = chartData.map(d => d.leaf_wetness_hours || 0).filter(v => !isNaN(v) && isFinite(v));

      // VPD typically ranges 0-2, round up to nearest 0.2
      const vpdMax = Math.ceil(Math.max(...vpdValues, 1.6) * 5) / 5;
      // Temperature - use actual min/max
      const tempMin = Math.floor(Math.min(...tempValues) / 5) * 5;
      const tempMax = Math.ceil(Math.max(...tempValues) / 5) * 5;
      // GDD - cumulative, starts from min and goes to max
      const gddMin = Math.floor(Math.min(...gddValues) / 500) * 500;
      const gddMax = Math.ceil(Math.max(...gddValues) / 500) * 500;
      // Wetness - typically 0-20 hours
      const wetMax = Math.max(Math.ceil(Math.max(...wetValues) / 5) * 5, 20);

      // ===== CHART 1: Soil Moisture vs Rainfall =====
      doc.fontSize(12).fillColor('#16a34a').font('Helvetica-Bold').text('1. Soil Moisture vs Rainfall Analysis', 50, yPos).font('Helvetica');
      yPos += 20;
      doc.fontSize(9).fillColor('#6b7280').text('Shows relationship between rainfall events (blue bars) and soil moisture levels (blue line). Optimal soil moisture for most crops is 40-70%.', 50, yPos, { width: 495 });
      yPos += 30;

      drawBarChart(chartData, 'precipitation', 50, yPos, chartW, chartH, '#93c5fd');
      drawLineChart(chartData, 'soil_moisture', 50, yPos, chartW, chartH, '#0ea5e9', '', 0, 100, true);
      yPos += chartH + 15;

      doc.fontSize(8).fillColor('#93c5fd').text('Blue Bars: Rainfall (mm)', 50, yPos);
      doc.fillColor('#0ea5e9').text('Blue Line: Soil Moisture (%)', 200, yPos);
      yPos += 15;
      doc.fontSize(8).fillColor('#16a34a').font('Helvetica-Bold').text('Insight: ', 50, yPos).font('Helvetica');
      doc.fillColor('#374151').text('Irrigate when moisture drops below 40% and no rain is forecasted.', 95, yPos);
      yPos += 35;

      // ===== CHART 2: VPD & Temperature =====
      doc.fontSize(12).fillColor('#16a34a').font('Helvetica-Bold').text('2. Water Stress (VPD) and Temperature', 50, yPos).font('Helvetica');
      yPos += 20;
      doc.fontSize(9).fillColor('#6b7280').text('VPD (Vapor Pressure Deficit) measures atmospheric dryness. Values above 1.5 kPa indicate high water stress conditions.', 50, yPos, { width: 495 });
      yPos += 30;

      // VPD as area chart on left axis (like Analytics page)
      drawAreaChart(chartData, 'vpd', 50, yPos, chartW, chartH, '#f97316', '#ffedd5', 0, vpdMax);
      // Temperature on right axis (dynamic scale)
      drawLineChartRightAxis(chartData, 'temperature_max', 50, yPos, chartW, chartH, '#ef4444', tempMin, tempMax);

      // Reference line at VPD 1.5
      const refY = yPos + chartH - (1.5 / vpdMax) * chartH;
      doc.strokeColor('#dc2626').lineWidth(1).dash(3, { space: 3 }).moveTo(50, refY).lineTo(450, refY).stroke().undash();
      doc.fontSize(7).fillColor('#dc2626').text('High Stress (1.5)', 455, refY - 4);
      yPos += chartH + 15;

      doc.fontSize(8).fillColor('#f97316').text('Orange Area: VPD (kPa) - Left', 50, yPos);
      doc.fillColor('#ef4444').text('Red Line: Temperature (C) - Right', 220, yPos);
      yPos += 15;
      doc.fontSize(8).fillColor('#16a34a').font('Helvetica-Bold').text('Insight: ', 50, yPos).font('Helvetica');
      doc.fillColor('#374151').text('Days with VPD > 1.5 kPa require increased irrigation or shade protection.', 95, yPos);

      // ===== PAGE 2: Charts 3 & 4 =====
      doc.addPage();
      yPos = 40;

      // ===== CHART 3: Crop Health Indices =====
      doc.fontSize(12).fillColor('#16a34a').font('Helvetica-Bold').text('3. Crop Health Indices Comparison', 50, yPos).font('Helvetica');
      yPos += 20;
      doc.fontSize(9).fillColor('#6b7280').text('Compares four vegetation indices over time. All indices range from 0 to 1, with higher values indicating healthier vegetation.', 50, yPos, { width: 495 });
      yPos += 30;

      drawLineChart(chartData, 'ndvi_smooth', 50, yPos, chartW, chartH, '#16a34a', '', 0, 1, true);
      drawLineChart(chartData, 'evi', 50, yPos, chartW, chartH, '#2563eb', '', 0, 1, false);
      drawLineChart(chartData, 'ndre', 50, yPos, chartW, chartH, '#9333ea', '', 0, 1, false);
      drawLineChart(chartData, 'savi', 50, yPos, chartW, chartH, '#ca8a04', '', 0, 1, false);
      yPos += chartH + 15;

      doc.fontSize(8).fillColor('#16a34a').text('Green: NDVI (Health)', 50, yPos);
      doc.fillColor('#2563eb').text('Blue: EVI (Enhanced)', 150, yPos);
      doc.fillColor('#9333ea').text('Purple: NDRE (Nitrogen)', 250, yPos);
      doc.fillColor('#ca8a04').text('Yellow: SAVI (Soil-adj)', 370, yPos);
      yPos += 15;
      doc.fontSize(8).fillColor('#16a34a').font('Helvetica-Bold').text('Insight: ', 50, yPos).font('Helvetica');
      doc.fillColor('#374151').text('Diverging NDVI and NDRE trends may indicate nitrogen deficiency in your crops.', 95, yPos);
      yPos += 40;

      // ===== CHART 4: Disease Risk & Growth =====
      doc.fontSize(12).fillColor('#16a34a').font('Helvetica-Bold').text('4. Disease Risk and Growth Tracking', 50, yPos).font('Helvetica');
      yPos += 20;
      doc.fontSize(9).fillColor('#6b7280').text('Leaf wetness hours (bars) indicate fungal disease risk. GDD line tracks cumulative heat units for crop development.', 50, yPos, { width: 495 });
      yPos += 30;

      // Draw axes first
      doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, yPos).lineTo(50, yPos + chartH).lineTo(450, yPos + chartH).stroke();
      doc.fontSize(7).fillColor('#6b7280').text(wetMax.toString(), 25, yPos - 3).text('0', 35, yPos + chartH - 5);

      // Leaf wetness bars with explicit max scale
      drawBarChart(chartData, 'leaf_wetness_hours', 50, yPos, chartW, chartH, '#a5b4fc', wetMax);

      // GDD on right axis (dynamic scale)
      drawLineChartRightAxis(chartData, 'cum_gdd', 50, yPos, chartW, chartH, '#f59e0b', gddMin, gddMax);

      // Disease threshold line at 10 hours
      const diseaseRefY = yPos + chartH - (10 / wetMax) * chartH;
      doc.strokeColor('#ef4444').lineWidth(1).dash(3, { space: 3 }).moveTo(50, diseaseRefY).lineTo(450, diseaseRefY).stroke().undash();
      doc.fontSize(7).fillColor('#ef4444').text('Disease Risk (10h)', 455, diseaseRefY - 4);
      yPos += chartH + 15;

      doc.fontSize(8).fillColor('#a5b4fc').text('Blue Bars: Leaf Wetness (hrs) - Left', 50, yPos);
      doc.fillColor('#f59e0b').text('Orange Line: Cumulative GDD - Right', 230, yPos);
      yPos += 15;
      doc.fontSize(8).fillColor('#16a34a').font('Helvetica-Bold').text('Insight: ', 50, yPos).font('Helvetica');
      doc.fillColor('#374151').text('High leaf wetness (>10h) + moderate temps (15-25 C) = highest fungal disease risk.', 95, yPos);
      yPos += 30;

    } else {
      doc.fontSize(11).fillColor('#9ca3af').text('Analytics data not available for this field.', 50, yPos);
      doc.fontSize(9).text('Weather and crop analytics require field coordinates and API connectivity.', 50, yPos + 18);
    }


    // ==================== FINAL PAGE: RECOMMENDATIONS ====================
    doc.addPage();
    yPos = 40;
    doc.fontSize(22).fillColor('#16a34a').text('Recommendations & Action Items', 50, yPos, { align: 'center' });
    yPos += 50;

    const recommendations = [];

    // Generate smart recommendations
    if (heatmaps.NDVI?.statistics) {
      const stats = heatmaps.NDVI.statistics;
      const healthyPct = (stats['Healthy'] || 0) + (stats['Overgrown'] || 0);
      const stressedPct = (stats['Moderately Diseased'] || 0) + (stats['Highly Diseased'] || 0);

      if (healthyPct > 70) {
        recommendations.push({ type: 'success', title: 'Excellent Crop Health', text: `${healthyPct.toFixed(0)}% of your field shows healthy vegetation. Continue current practices and maintain regular monitoring.` });
      } else if (stressedPct > 30) {
        recommendations.push({ type: 'warning', title: 'Stress Areas Detected', text: `${stressedPct.toFixed(0)}% of field shows stress. Investigate affected zones for water, nutrient, or pest issues. Consider targeted intervention.` });
      }
    }

    if (processedData.length > 0) {
      const recentVPD = processedData.slice(-7).reduce((s, d) => s + (d.vpd || 0), 0) / 7;
      const recentRain = processedData.slice(-7).reduce((s, d) => s + (d.precipitation || 0), 0);
      const recentWetness = processedData.slice(-7).filter(d => (d.leaf_wetness_hours || 0) > 10).length;

      if (recentVPD > 1.5) {
        recommendations.push({ type: 'warning', title: 'Water Stress Alert', text: `Average VPD of ${recentVPD.toFixed(2)} kPa in last 7 days indicates water stress. Increase irrigation frequency or consider mulching to retain soil moisture.` });
      }
      if (recentRain < 5) {
        recommendations.push({ type: 'info', title: 'Low Rainfall Period', text: `Only ${recentRain.toFixed(1)}mm rainfall in the past week. Monitor soil moisture closely and irrigate if levels drop below 40%.` });
      }
      if (recentWetness >= 3) {
        recommendations.push({ type: 'warning', title: 'Disease Risk Alert', text: `${recentWetness} days with high leaf wetness (>10 hrs) in the past week. Consider preventive fungicide application, especially for susceptible crops.` });
      }
    }

    if (recommendations.length === 0) {
      recommendations.push({ type: 'info', title: 'Continue Monitoring', text: 'No immediate concerns detected. Continue regular field monitoring using the AgriVision dashboard for real-time updates.' });
    }

    // Display recommendations
    recommendations.forEach(rec => {
      const bg = rec.type === 'success' ? '#f0fdf4' : rec.type === 'warning' ? '#fef3c7' : '#eff6ff';
      const border = rec.type === 'success' ? '#16a34a' : rec.type === 'warning' ? '#f59e0b' : '#3b82f6';

      doc.rect(50, yPos, 495, 60).fillColor(bg).fill();
      doc.rect(50, yPos, 4, 60).fillColor(border).fill();
      doc.fontSize(11).fillColor('#1f2937').font('Helvetica-Bold').text(rec.title, 65, yPos + 12).font('Helvetica');
      doc.fontSize(9).fillColor('#4b5563').text(rec.text, 65, yPos + 30, { width: 465 });
      yPos += 70;
    });

    // Notes
    yPos += 20;
    doc.fontSize(12).fillColor('#16a34a').font('Helvetica-Bold').text('Technical Notes', 50, yPos).font('Helvetica');
    yPos += 18;
    doc.fontSize(8).fillColor('#6b7280')
      .text('• Vegetation indices are calculated from Sentinel-2 satellite imagery (last 60 days, least cloud cover selected)', 50, yPos)
      .text('• Weather data sourced from meteorological stations and satellite observations via Open-Meteo API', 50, yPos + 12)
      .text('• VPD (Vapor Pressure Deficit) values above 1.5 kPa indicate conditions where plants struggle to maintain transpiration', 50, yPos + 24)
      .text('• GDD (Growing Degree Days) calculated using base temperature of 10 C for most crops', 50, yPos + 36)
      .text('• For best results, generate reports weekly to track crop development trends over time', 50, yPos + 48);

    // Footer
    yPos = 750;
    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, yPos - 15).lineTo(545, yPos - 15).stroke();
    doc.fontSize(10).fillColor('#16a34a').font('Helvetica-Bold').text('AgriVision', 50, yPos).font('Helvetica');
    doc.fontSize(8).fillColor('#6b7280').text('Agricultural Intelligence Platform | www.agrivision.com', 50, yPos + 12);
    doc.text(`Report ID: RPT-${Date.now()} | Generated: ${new Date().toISOString()}`, 300, yPos + 6);

    doc.end();
  } catch (error) {
    console.error("Report generation error:", error);
    res.status(500).json({ error: error.message });
  }
};