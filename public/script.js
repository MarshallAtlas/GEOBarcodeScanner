const codeReader = new ZXing.BrowserMultiFormatReader();
const videoElement = document.getElementById('video');
const resultsElement = document.getElementById('results');
const clearBtn = document.getElementById('clear-btn');

let scanHistory = [];

// Format timestamp
function formatTime(date) {
  return date.toLocaleString(); // e.g. "9/3/2025, 10:45:12 AM"
}

// Render results list
function renderResults() {
  resultsElement.innerHTML = "";
  scanHistory.slice(0, 5).forEach(item => {
    const div = document.createElement("div");
    div.className = "result-item";
    div.innerHTML = `
      <div><strong>${item.text}</strong></div>
      <div class="result-time">${item.time}</div>
    `;
    resultsElement.appendChild(div);
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
        const text = result.getText();
        const timestamp = formatTime(new Date());
        console.log("Detected:", text, "at", timestamp);

        // Add new scan if not duplicate-in-a-row
        if (!scanHistory[0] || scanHistory[0].text !== text) {
          scanHistory.unshift({ text, time: timestamp });
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
