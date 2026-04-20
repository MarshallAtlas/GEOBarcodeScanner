// db.js
const sql = require("mssql/msnodesqlv8");
require("dotenv").config();

const server = process.env.DB_SERVER || "SJARANILLA";
const database = process.env.DB_NAME || "barcodeTest";

const config = {
  connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${server};Database=${database};Trusted_Connection=yes;`
};

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
