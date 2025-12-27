const statusEl = document.getElementById("status");
function setStatus(msg) { if (statusEl) statusEl.textContent = msg; }

async function api(url, options = {}) {
  const res = await fetch(url, { credentials: "include", ...options });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/* =========================
   Logout
   ========================= */
const logoutBtn = document.getElementById("btn-logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); }
    finally { window.location.href = "/login.html"; }
  });
}

/* =========================
   Tabs
   ========================= */
const tabButtons = Array.from(document.querySelectorAll("[data-tab]"));
const panels = Array.from(document.querySelectorAll("[data-panel]"));

function setTab(tabName) {
  tabButtons.forEach(btn => {
    const isActive = btn.dataset.tab === tabName;
    btn.classList.toggle("primary", isActive);
  });
  panels.forEach(p => {
    const show = p.dataset.panel === tabName;
    p.style.display = show ? "" : "none";
  });
  setStatus(`Tab: ${tabName}`);
}

tabButtons.forEach(btn => btn.addEventListener("click", () => setTab(btn.dataset.tab)));

/* default */
setTab("devices");

/* =========================
   DEVICES tab - control + create
   (uses existing APIs you already have)
   ========================= */
const deviceSelect = document.getElementById("device-select");
const reloadBtn = document.getElementById("btn-reload");

async function loadDevices() {
  const r = await api("/api/get-devices");
  if (!r.ok) {
    setStatus(r.data?.message || "Failed to load devices (auth?)");
    if (r.status === 401) window.location.href = "/login.html";
    return;
  }

  deviceSelect.innerHTML = "";
  for (const d of (r.data.devices || [])) {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = d.name || `Device ${d.id}`;
    deviceSelect.appendChild(opt);
  }
  setStatus(`Loaded ${r.data.devices?.length || 0} devices`);
}

if (reloadBtn) reloadBtn.addEventListener("click", loadDevices);

document.querySelectorAll(".key[data-cmd]").forEach(btn => {
  btn.addEventListener("click", async () => {
    const deviceId = Number(deviceSelect?.value);
    const command = btn.dataset.cmd;
    if (!deviceId) return setStatus("Select a device first.");

    const r = await api("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, command })
    });

    if (!r.ok) {
      setStatus(r.data?.message || "Command failed");
      if (r.status === 401) window.location.href = "/login.html";
      return;
    }
    setStatus(`Sent: ${command}`);
  });
});

/* Create device (UI matches production requirements; APIs for zones/categories come next) */
const prereqBox = document.getElementById("device-prereq");
const addName = document.getElementById("add-name");
const addIp = document.getElementById("add-ip");
const addCategory = document.getElementById("add-category");
const addZone = document.getElementById("add-zone");
const addBtn = document.getElementById("btn-add-device");

function showPrereq(msg) {
  if (!prereqBox) return;
  prereqBox.style.display = "";
  prereqBox.textContent = msg;
}

function hidePrereq() {
  if (!prereqBox) return;
  prereqBox.style.display = "none";
}

/* For now, until you implement zones/categories APIs, keep dropdowns empty but show a hint */
function seedEmptyPrereq() {
  const catEmpty = !addCategory?.options?.length;
  const zoneEmpty = !addZone?.options?.length;

  if (catEmpty && zoneEmpty) return showPrereq("Create Category first and Create Zone first (Zones / Categories tab).");
  if (catEmpty) return showPrereq("Create Category first (Zones / Categories tab).");
  if (zoneEmpty) return showPrereq("Create Zone first (Zones / Categories tab).");

  hidePrereq();
}

if (addBtn) {
  addBtn.addEventListener("click", async () => {
    const name = addName.value.trim();
    const ip = addIp.value.trim();
    const categoryId = Number(addCategory.value);
    const zoneId = Number(addZone.value);

    if (!name || !ip) return setStatus("Name and IP are required.");
    if (!categoryId) return setStatus("Category is required.");
    if (!zoneId) return setStatus("Zone is required.");

    const r = await api("/api/add-device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ip, categoryId, zoneId })
    });

    if (!r.ok) {
      setStatus(r.data?.message || "Add device failed");
      if (r.status === 401) window.location.href = "/login.html";
      return;
    }

    setStatus("Device created.");
    await loadDevices();
  });
}

/* Init */
loadDevices().finally(seedEmptyPrereq);
