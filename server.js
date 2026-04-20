// server.js - with debug logging
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { getPool } = require("./db");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Debug: log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10kb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, error: "Too many requests" }
});
app.use("/api/", limiter);

// Health check - register FIRST
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
console.log("Registered: GET /api/health");

// Register save-scan
app.post("/api/save-scan", async (req, res) => {
  console.log("HIT: POST /api/save-scan", req.body);
  const { raw, id, name, type, time } = req.body;

  // Validation
  if (!raw || typeof raw !== 'string' || raw.length === 0) {
    return res.status(400).json({ success: false, error: 'Raw is required' });
  }
  if (!id || typeof id !== 'string' || id.length === 0) {
    return res.status(400).json({ success: false, error: 'Id is required' });
  }
  if (!name || typeof name !== 'string' || name.length === 0) {
    return res.status(400).json({ success: false, error: 'Name is required' });
  }
  if (!type || typeof type !== 'string' || type.length === 0) {
    return res.status(400).json({ success: false, error: 'Type is required' });
  }
  if (!time || typeof time !== 'string' || time.length === 0) {
    return res.status(400).json({ success: false, error: 'Time is required' });
  }

  try {
    const pool = await getPool();

    // Check duplicate
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const existing = await pool.request()
      .input("Raw", raw)
      .input("TimeThreshold", fiveMinutesAgo)
      .query(`SELECT TOP 1 Id FROM ScanHistory WHERE Raw = @Raw AND TimeScanned > @TimeThreshold`);

    if (existing.recordset.length > 0) {
      return res.status(409).json({ success: false, error: "Duplicate scan" });
    }

    // Get next ScanId
    const result = await pool.request().query(`SELECT ISNULL(MAX(CAST(ScanId AS INT)), 0) + 1 AS NextId FROM ScanHistory`);
    const scanId = result.recordset[0].NextId.toString().padStart(4, '0');

    // Parse time
    let timeScanned = time ? new Date(time) : new Date();
    if (isNaN(timeScanned.getTime())) timeScanned = new Date();

    await pool.request()
      .input("ScanId", scanId)
      .input("Raw", raw)
      .input("Id", id)
      .input("Name", name)
      .input("Type", type)
      .input("TimeScanned", timeScanned)
      .query(`INSERT INTO ScanHistory (ScanId, Raw, Id, Name, Type, TimeScanned) VALUES (@ScanId, @Raw, @Id, @Name, @Type, @TimeScanned)`);

    res.json({ success: true, scanId, message: "Scan saved!" });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to save scan" });
  }
});
console.log("Registered: POST /api/save-scan");

// Register save-all
app.post("/api/save-all", async (req, res) => {
  console.log("HIT: POST /api/save-all", req.body);
  const { scans } = req.body;

  if (!Array.isArray(scans) || scans.length === 0) {
    return res.status(400).json({ success: false, error: "Invalid request" });
  }

  try {
    const pool = await getPool();
    let saved = 0;
    let skipped = 0;

    for (const scan of scans) {
      const { raw, id, name, type, time } = scan;

      // Validation
      if (!raw || !id || !name || !type || !time) {
        return res.status(400).json({ success: false, error: "Missing fields in scan" });
      }

      // Check duplicate
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const existing = await pool.request()
        .input("Raw", raw)
        .input("TimeThreshold", fiveMinutesAgo)
        .query(`SELECT TOP 1 Id FROM ScanHistory WHERE Raw = @Raw AND TimeScanned > @TimeThreshold`);

      if (existing.recordset.length > 0) {
        skipped++;
        continue;
      }

      // Get next ScanId
      const result = await pool.request().query(`SELECT ISNULL(MAX(CAST(ScanId AS INT)), 0) + 1 AS NextId FROM ScanHistory`);
      const scanId = result.recordset[0].NextId.toString().padStart(4, '0');

      // Parse time
      let timeScanned = time ? new Date(time) : new Date();
      if (isNaN(timeScanned.getTime())) timeScanned = new Date();

      await pool.request()
        .input("ScanId", scanId)
        .input("Raw", raw)
        .input("Id", id)
        .input("Name", name)
        .input("Type", type)
        .input("TimeScanned", timeScanned)
        .query(`INSERT INTO ScanHistory (ScanId, Raw, Id, Name, Type, TimeScanned) VALUES (@ScanId, @Raw, @Id, @Name, @Type, @TimeScanned)`);

      saved++;
    }

    res.json({
      success: true,
      saved,
      skipped,
      message: `Saved ${saved} scan(s)${skipped > 0 ? `, ${skipped} duplicate(s) skipped` : ''}`
    });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to save scans" });
  }
});
console.log("Registered: POST /api/save-all");

// Static files (registered AFTER API routes)
app.use(express.static(path.join(__dirname, "public")));
console.log("Registered: static files from public/");

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});