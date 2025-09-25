// db.js
const sql = require("mssql");

const config = {
  user: "GEODATA/mflorendo",
  password: "",
  server: "SJARANILLIA",   // or your SQL Server host
  database: "barcodeTest",
  options: {
    encrypt: false,      // set true for Azure
    trustServerCertificate: true // required for self-signed certs
  }
};

async function getPool() {
  try {
    return await sql.connect(config);
  } catch (err) {
    console.error("Database connection failed:", err);
    throw err;
  }
}

module.exports = { sql, getPool };
