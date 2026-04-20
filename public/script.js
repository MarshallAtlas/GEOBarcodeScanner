const codeReader = new ZXing.BrowserMultiFormatReader();
const videoElement = document.getElementById('video');
const resultsElement = document.getElementById('results');
const clearBtn = document.getElementById('clear-btn');
const saveAllBtn = document.getElementById('save-all-btn');

let scanHistory = [];

// Format timestamp
function formatTime(date) {
  return date.toLocaleString();
}

// Parse scanned text
function parseScan(text) {
  if (text.startsWith("#test")) {
    const payload = text.replace("#test", "");
    const cleaned = payload.startsWith(",") ? payload.slice(1) : payload;
    const parts = cleaned.split(",");
    if (parts.length === 3) {
      return {
        id: parts[0],
        name: parts[1],
        type: parts[2],
        valid: true
      };
    }
  }
  return { id: "Invalid", name: "Invalid", type: "Invalid", valid: false };
}

// Render results list
function renderResults() {
  resultsElement.innerHTML = "";
  scanHistory.slice().forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "result-item";

    div.innerHTML = `
      <div><strong>Raw:</strong> ${item.raw}</div>
      <div><strong>ID:</strong> ${item.id}</div>
      <div><strong>Name:</strong> ${item.name}</div>
      <div><strong>Type:</strong> ${item.type}</div>
      <div class="result-time">${item.time}</div>
      <button class="remove-btn" data-index="${index}">Remove</button>
    `;

    resultsElement.appendChild(div);
  });

  // Attach remove button listeners
  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.target.getAttribute("data-index"));
      scanHistory.splice(idx, 1);
      renderResults();
    });
  });

  // Update save button state
  saveAllBtn.disabled = scanHistory.length === 0;
}

// Show status message
function showStatus(message, isError = false) {
  const existing = resultsElement.querySelector(".status-message");
  if (existing) existing.remove();

  const statusEl = document.createElement("div");
  statusEl.className = isError ? "status-message error" : "status-message";
  statusEl.textContent = message;
  resultsElement.prepend(statusEl);

  setTimeout(() => {
    if (statusEl.parentNode) statusEl.remove();
  }, 5000);
}

// Save all scans to backend
async function saveAllToBackend() {
  if (scanHistory.length === 0) return;

  saveAllBtn.disabled = true;
  saveAllBtn.textContent = "Saving...";

  try {
    const response = await fetch('/api/save-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scans: scanHistory.map(item => ({
          raw: item.raw,
          id: item.id,
          name: item.name,
          type: item.type,
          time: new Date(item.time).toISOString()
        }))
      })
    });

    const result = await response.json();

    if (response.ok) {
      showStatus(result.message);
      scanHistory = [];
      renderResults();
    } else {
      showStatus(result.error || "Failed to save", true);
    }
  } catch (err) {
    console.error("Network error:", err);
    showStatus("Network error - could not save", true);
  }

  saveAllBtn.disabled = false;
  saveAllBtn.textContent = "Save All to Database";
}

// Event listeners
clearBtn.addEventListener("click", () => {
  scanHistory = [];
  renderResults();
});

saveAllBtn.addEventListener("click", saveAllToBackend);

// Start scanning
codeReader
  .listVideoInputDevices()
  .then(videoInputDevices => {
    if (videoInputDevices.length === 0) {
      resultsElement.innerHTML = "<div class='result-item'>No camera found!</div>";
      return;
    }

    let selectedDeviceId = videoInputDevices[0].deviceId;
    if (videoInputDevices.length > 1) {
      const backCam = videoInputDevices.find(d => d.label.toLowerCase().includes('back'));
      if (backCam) selectedDeviceId = backCam.deviceId;
    }

    codeReader.decodeFromVideoDevice(selectedDeviceId, videoElement, (result, err) => {
      if (result) {
        const rawText = result.getText();
        const timestamp = formatTime(new Date());
        console.log("Detected:", rawText, "at", timestamp);

        // Only add if not duplicate of most recent
        if (!scanHistory[0] || scanHistory[0].raw !== rawText) {
          const parsed = parseScan(rawText);
          scanHistory.unshift({
            raw: rawText,
            id: parsed.id,
            name: parsed.name,
            type: parsed.type,
            time: timestamp
          });

          // Keep only last 20 scans in memory
          if (scanHistory.length > 20) {
            scanHistory = scanHistory.slice(0, 20);
          }

          renderResults();
        }
      }
      if (err && !(err instanceof ZXing.NotFoundException)) {
        console.error("Scan error:", err);
      }
    });
  })
  .catch(err => {
    console.error("Camera initialization error:", err);
    resultsElement.innerHTML = "<div class='result-item'>Camera access denied or unavailable</div>";
  });