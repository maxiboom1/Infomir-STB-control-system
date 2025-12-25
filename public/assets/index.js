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

        const res = await fetch("/api/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deviceId, command }),
        });

        let data = null;
        try { data = await res.json(); } catch (_) { }

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
// Admin: Add device
// --------------------
const addNameEl = document.getElementById("add-name");
const addIpEl = document.getElementById("add-ip");
const addCategoryEl = document.getElementById("add-category");
const addZoneEl = document.getElementById("add-zone");
const addBtn = document.getElementById("btn-add-device");

function setSelectPlaceholder(select, text) {
    select.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = text;
    select.appendChild(opt);
}

function fillSelect(select, items, { valueKey = "id", labelKey = "name", firstLabel = "Select..." } = {}) {
    select.innerHTML = "";

    const first = document.createElement("option");
    first.value = "";
    first.textContent = firstLabel;
    select.appendChild(first);

    for (const item of items) {
        const opt = document.createElement("option");
        opt.value = item[valueKey];
        opt.textContent = item[labelKey];
        select.appendChild(opt);
    }
}

async function loadCategories() {
    // POC-friendly: if endpoint doesn't exist, keep UI usable
    setSelectPlaceholder(addCategoryEl, "Loading...");

    try {
        const res = await fetch("/api/get-categories");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const categories = data.categories || data;

        if (!Array.isArray(categories) || categories.length === 0) {
            setSelectPlaceholder(addCategoryEl, "No categories");
            return;
        }

        fillSelect(addCategoryEl, categories, { firstLabel: "Select category..." });
    } catch (_) {
        // Endpoint may not exist yet in your POC
        setSelectPlaceholder(addCategoryEl, "N/A (POC)");
    }
}

async function loadZones() {
    setSelectPlaceholder(addZoneEl, "Loading...");

    try {
        const res = await fetch("/api/get-zones");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const zones = data.zones || data;

        if (!Array.isArray(zones) || zones.length === 0) {
            setSelectPlaceholder(addZoneEl, "No zones");
            return;
        }

        fillSelect(addZoneEl, zones, { firstLabel: "Select zone..." });
    } catch (_) {
        setSelectPlaceholder(addZoneEl, "N/A (POC)");
    }
}

addBtn.addEventListener("click", async () => {
    const name = addNameEl.value.trim();
    const ip = addIpEl.value.trim();
    const category = addCategoryEl.value || null;
    const zone = addZoneEl.value || null;
  
    if (!name) return (statusEl.textContent = "Please enter device name.");
    if (!ip) return (statusEl.textContent = "Please enter device IP.");
  
    try {
      statusEl.textContent = "Adding device...";
  
      const res = await fetch("/api/add-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ip, category, zone }),
      });
  
      const data = await res.json().catch(() => null);
  
      // Works whether backend uses HTTP error codes OR always 200 with ok:false
      const ok = (res.ok && data?.ok !== false) || data?.ok === true;
  
      if (!ok) {
        statusEl.textContent = data?.message || `Add device failed (HTTP ${res.status})`;
        return;
      }
  
      statusEl.textContent = data?.message || "Device added.";
      addNameEl.value = "";
      addIpEl.value = "";
  
      await loadDevices();
    } catch (e) {
      statusEl.textContent = `Error adding device: ${e.message}`;
    }
  });
  

window.addEventListener("DOMContentLoaded", async () => {
    await loadDevices();
    await loadCategories();
    await loadZones();
});
