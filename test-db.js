const sql = require("mssql");

const config = {
  user: "GEODATA\\mflorendo",
  password: ".",
  server: "localhost",     // or IP/hostname
  database: "barcodeTest",
  options: {
    encrypt: false,        // true if using Azure SQL
    trustServerCertificate: true
  }
};

async function testConnection() {
  try {
    let pool = await sql.connect(config);
    console.log("✅ Database connection successful!");

    // Run a simple query
    let result = await pool.request().query("SELECT GETDATE() AS CurrentTime");
    console.log("Query result:", result.recordset);

    await sql.close();
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
}

testConnection();
