const codeReader = new ZXing.BrowserMultiFormatReader();
const videoElement = document.getElementById('video');
const resultsElement = document.getElementById('results');
const clearBtn = document.getElementById('clear-btn');

let scanHistory = [];

// Format timestamp
function formatTime(date) {
  return date.toLocaleString();
}

// Parse scanned text
function parseScan(text) {
  if (text.startsWith("#test")) {
    const payload = text.replace("#test", "");
    // Remove leading comma
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
  scanHistory.slice(0, 5).forEach((item, index) => {
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
      const idx = e.target.getAttribute("data-index");
      scanHistory.splice(idx, 1);
      renderResults();
    });
  });
}

// Clear history
clearBtn.addEventListener("click", () => {
  scanHistory = [];
  renderResults();
});

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

        if (!scanHistory[0] || scanHistory[0].raw !== rawText) {
          const parsed = parseScan(rawText);
          scanHistory.unshift({
            raw: rawText,
            id: parsed.id,
            name: parsed.name,
            type: parsed.type,
            time: timestamp
          });
          if (scanHistory.length > 5) {
            scanHistory = scanHistory.slice(0, 5);
          }
          renderResults();
        }
      }
      if (err && !(err instanceof ZXing.NotFoundException)) {
        console.error("Error:", err);
      }
    });
  })
  .catch(err => console.error(err));
