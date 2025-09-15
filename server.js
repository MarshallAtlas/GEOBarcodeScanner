// server.js
const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Serve static files from "public"
app.use(express.static(path.join(__dirname, "public")));

// Example API route (for later use)
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
