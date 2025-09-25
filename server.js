// server.js
const express = require("express");
const bodyParser = require("body-parser");
const { getpool } = require("./db")
const path = require("path");

const app = express();
app.use(bodyParser.json());
const PORT = 3000;

//apu Route to save data 
app.post("/api/save-scan", async (req,res) => {
  const { raw, id, name, type, time } =req.body;

    try {
    const pool = await getPool();
    await pool.request()
      .input("Raw", raw)
      .input("Id", id)
      .input("Name", name)
      .input("Type", type)
      .input("Time", time)
      .query(`
        INSERT INTO ScanHistory (Raw, Id, Name, Type, TimeScanned)
        VALUES (@Raw, @Id, @Name, @Type, @Time)
      `);

    res.json({ success: true, message: "Scan saved!" });
  } catch (err) {
    console.error("Error saving scan:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve static files from "public"
app.use(express.static(path.join(__dirname, "public")));

// Example API route (for later use)
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
