document.getElementById("btn-up").onclick = () => send("up");
document.getElementById("btn-down").onclick = () => send("down");
document.getElementById("btn-left").onclick = () => send("left");
document.getElementById("btn-right").onclick = () => send("right");

// ---- PCAP upload ----
const uploadBtn = document.getElementById("btn-upload");
const fileInput = document.getElementById("pcap-input");
const statusEl = document.getElementById("status");

uploadBtn.onclick = () => fileInput.click();

fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    const name = document.getElementById("device-name").value.trim();
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

        // Read JSON even on non-200
        let data = null;
        try { data = await res.json(); } catch (_) { }

        if (!res.ok) {
            statusEl.textContent = data?.message || `Upload failed (HTTP ${res.status})`;
            return;
        }

        statusEl.textContent = data?.message || "PCAP uploaded.";
    } catch (err) {
        statusEl.textContent = "Error uploading PCAP: " + err.message;
    } finally {
        fileInput.value = "";
    }
};

async function send(command) {
    const status = document.getElementById("status");
    const select = document.getElementById("device-select");
    const deviceId = Number(select?.value);
  
    if (!deviceId) {
      status.textContent = "Please select a device first.";
      return;
    }
  
    try {
      status.textContent = `Sending ${command} to device #${deviceId}...`;
  
      const res = await fetch("/control/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, command }),
      });
  
      let data = null;
      try { data = await res.json(); } catch (_) {}
  
      if (!res.ok) {
        status.textContent = data?.message || `Error sending ${command} (HTTP ${res.status})`;
        return;
      }
  
      status.textContent = data?.message || `Sent ${command} to device #${deviceId}.`;
    } catch (e) {
      status.textContent = `Error sending ${command}: ${e.message}`;
    }
  }
  

async function loadDevices() {
    const select = document.getElementById("device-select");
    select.innerHTML = "<option>Loading...</option>";

    try {
        const res = await fetch("/api/get-devices");
        const data = await res.json();

        const devices = data.devices || data; // supports both {devices:[]} or [] depending on your route
        select.innerHTML = "";

        if (!devices || devices.length === 0) {
            select.innerHTML = "<option value=''>No devices</option>";
            return;
        }

        for (const d of devices) {
            const opt = document.createElement("option");
            opt.value = d.id;      // <-- used later for commands
            opt.textContent = d.name; // <-- shown to user
            select.appendChild(opt);
        }
    } catch (e) {
        select.innerHTML = "<option value=''>Error loading devices</option>";
    }
}

window.addEventListener("DOMContentLoaded", loadDevices);