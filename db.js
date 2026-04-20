// db.js
const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER || "GEODATA/mflorendo",
  password: process.env.DB_PASSWORD || "",
  server: process.env.DB_SERVER || "SJARANILLA",
  database: process.env.DB_NAME || "barcodeTest",
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Create connection pool (lazy - doesn't connect until first request)
const pool = new sql.ConnectionPool(config);

async function getPool() {
  try {
    if (!pool.connected) {
      await pool.connect();
    }
    return pool;
  } catch (err) {
    console.error("Database connection error:", err.message);
    throw err;
  }
}

module.exports = { sql, getPool };