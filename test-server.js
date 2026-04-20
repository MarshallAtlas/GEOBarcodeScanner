// test-server.js - with routes registered AFTER static
const express = require("express");
const path = require("path");

const app = express();
const PORT = 3002;

app.use(express.json());

// Register static FIRST, then routes
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/save-all", (req, res) => {
  console.log("API-SAVE-ALL CALLED", req.body);
  res.json({ received: req.body });
});

app.post("/test", (req, res) => {
  console.log("TEST CALLED", req.body);
  res.json({ received: req.body });
});

app.listen(PORT, () => {
  console.log(`Test server on http://localhost:${PORT}`);
});