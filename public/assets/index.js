// assets/index.js

const statusEl = document.getElementById("status");
const selectEl = document.getElementById("device-select");
const reloadBtn = document.getElementById("btn-reload");

// --------------------
// Control buttons
// --------------------
const keypad = document.getElementById("keypad");

keypad.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-cmd]");
  if (!btn) return;
  send(btn.dataset.cmd);
});

async function send(command) {
  const deviceId = Number(selectEl?.value);
  if (!deviceId) {
    statusEl.textContent = "Please select a device first.";
    return;
  }

  try {
    statusEl.textContent = `Sending ${command} to device #${deviceId}...`;

    const res = await fetch("/control/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, command }),
    });

    let data = null;
    try { data = await res.json(); } catch (_) {}

    if (!res.ok) {
      statusEl.textContent = data?.message || `Error sending ${command} (HTTP ${res.status})`;
      return;
    }

    statusEl.textContent = data?.message || `Sent ${command} to device #${deviceId}.`;
  } catch (e) {
    statusEl.textContent = `Error sending ${command}: ${e.message}`;
  }
}

// --------------------
// Devices dropdown
// --------------------
async function loadDevices() {
  selectEl.innerHTML = "<option>Loading...</option>";

  try {
    const res = await fetch("/api/get-devices");
    const data = await res.json();
    const devices = data.devices || data; // supports both {devices:[]} or []

    selectEl.innerHTML = "";

    if (!devices || devices.length === 0) {
      selectEl.innerHTML = "<option value=''>No devices</option>";
      return;
    }

    for (const d of devices) {
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = d.name;
      selectEl.appendChild(opt);
    }
  } catch (e) {
    selectEl.innerHTML = "<option value=''>Error loading devices</option>";
  }
}

reloadBtn.addEventListener("click", () => loadDevices());

// --------------------
// PCAP upload
// --------------------
const uploadBtn = document.getElementById("btn-upload");
const fileInput = document.getElementById("pcap-input");
const nameInput = document.getElementById("device-name");

uploadBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  const name = nameInput.value.trim();
  if (!file) return;
  if (!name) {
    statusEl.textContent = "Please enter a device name.";
    return;
  }

  const formData = new FormData();
  formData.append("pcap", file);
  formData.append("name", name);

  try {
    statusEl.textContent = "Uploading PCAP...";

    const res = await fetch("/api/upload-pcap", {
      method: "POST",
      body: formData,
    });

    let data = null;
    try { data = await res.json(); } catch (_) {}

    if (!res.ok) {
      statusEl.textContent = data?.message || `Upload failed (HTTP ${res.status})`;
      return;
    }

    statusEl.textContent = data?.message || "PCAP uploaded.";

    // refresh dropdown after new device
    await loadDevices();
  } catch (err) {
    statusEl.textContent = "Error uploading PCAP: " + err.message;
  } finally {
    fileInput.value = "";
  }
});

window.addEventListener("DOMContentLoaded", loadDevices);
