/* MAG Control — Regular User UI (v0.8.x)
   Start screen: Category + Zone selectors → Open → Devices tiles + keypad
*/

const elMain = document.getElementById("main");
const elGrid = document.getElementById("grid");
const elEmpty = document.getElementById("empty");
const elEmptyTitle = document.getElementById("empty-title");
const elEmptySub = document.getElementById("empty-sub");
const elCrumb = document.getElementById("crumb");

const btnBack = document.getElementById("btn-back");
const btnLogout = document.getElementById("btn-logout");
const elBrandTitle = document.getElementById("brand-title");

const elStart = document.getElementById("start");
const elCatSelect = document.getElementById("category-select");
const elZoneSelect = document.getElementById("zone-select");
const btnOpen = document.getElementById("btn-open");

const elDrawer = document.getElementById("drawer");
const elStatus = document.getElementById("status");
const elKeypad = document.getElementById("keypad");
const elChannels = document.getElementById("channels");
const btnModeKeypad = document.getElementById("btn-mode-keypad");
const btnModeChannels = document.getElementById("btn-mode-channels");

// Mobile-only device picker (shown only on small screens in Devices view)
const elDevicePicker = document.getElementById("device-picker");
const elDeviceSelect = document.getElementById("device-select");

// About modal
const elAbout = document.getElementById("about-modal");
const btnAboutClose = document.getElementById("about-close");

const state = {
  tree: null,
  channelsMap: null,
  view: "start", // start | devices
  selectedCategoryId: null,
  selectedZoneId: null,
  selectedDeviceId: null,
  suppressZoneAutoOpen: false,
  drawerMode: "keypad", // keypad | channels
};

function isMobile() {
  return window.matchMedia && window.matchMedia("(max-width:520px)").matches;
}

function setStatus(msg, isError = false) {
  if (!elStatus) return;
  elStatus.textContent = msg || "";
  // footer default is green; errors can be red
  elStatus.style.color = isError ? "#ff3b30" : "";
}

function setDrawerMode(mode) {
  state.drawerMode = (mode === "channels") ? "channels" : "keypad";

  btnModeKeypad?.classList.toggle("is-active", state.drawerMode === "keypad");
  btnModeChannels?.classList.toggle("is-active", state.drawerMode === "channels");

  if (elKeypad) elKeypad.hidden = (state.drawerMode !== "keypad");
  if (elChannels) elChannels.hidden = (state.drawerMode !== "channels");

  if (state.drawerMode === "channels") renderChannelsList();
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

async function api(path, options) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (res.status === 401 || res.status === 403) {
    window.location.href = "/login.html";
    return null;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

function openDrawer(open) {
  if (!elDrawer) return;
  elDrawer.dataset.open = open ? "true" : "false";
}

function renderChannelsList() {
  if (!elChannels) return;
  const channels = Array.isArray(state.channelsMap) ? state.channelsMap : [];
  const named = channels
    .map(c => ({ channelNumber: Number(c?.channelNumber), name: String(c?.name || "").trim() }))
    .filter(c => Number.isInteger(c.channelNumber) && c.channelNumber >= 1 && c.channelNumber <= 64)
    .filter(c => c.name.length > 0)
    .sort((a, b) => a.channelNumber - b.channelNumber);

  if (!named.length) {
    elChannels.innerHTML = `<div class="hint" style="opacity:.75; padding:8px 2px;">No channels named yet.</div>`;
    return;
  }

  elChannels.innerHTML = `
    <div class="channels-grid">
      ${named.map(c => `
        <button class="key ch-card" data-ch="${c.channelNumber}" aria-label="Channel ${c.channelNumber}">
          <div class="ch-num">CH ${c.channelNumber}</div>
          <div class="ch-name">${escapeHtml(c.name)}</div>
        </button>
      `).join("")}
    </div>
  `;
}

function currentCategory() {
  return state.tree?.categories?.find(c => c.id === state.selectedCategoryId) || null;
}

function currentZone() {
  const cat = currentCategory();
  return cat?.zones?.find(z => z.id === state.selectedZoneId) || null;
}

function currentDevice() {
  const zone = currentZone();
  return zone?.devices?.find(d => d.id === state.selectedDeviceId) || null;
}

function setView(view) {
  state.view = view;
  document.body.dataset.view = view;
  render();
}

function buildCrumb() {
  const cat = currentCategory();
  const zone = currentZone();

  if (!state.tree) {
    elCrumb.textContent = "Loading…";
  } else if (state.view === "devices") {
    elCrumb.textContent = `${cat?.name || ""} / ${zone?.name || ""}`.trim();
  } else {
    // Start view
    const catName = cat?.name || "";
    const zoneName = zone?.name || "";
    const parts = ["Select", catName, zoneName].filter(Boolean);
    elCrumb.textContent = parts.join(" / ");
  }

  btnBack.disabled = (state.view !== "devices");
}

function showEmpty(title, sub) {
  if (elStart) elStart.hidden = true;
  if (elDevicePicker) elDevicePicker.hidden = true;
  if (elGrid) elGrid.innerHTML = "";
  elEmptyTitle.textContent = title || "Empty";
  elEmptySub.textContent = sub || "";
  elEmpty.hidden = false;
  openDrawer(false);
}

function hideEmpty() {
  elEmpty.hidden = true;
}

function renderDeviceTiles(devices) {
  const selectedId = state.selectedDeviceId;

  elGrid.innerHTML = (devices || []).map(d => {
    const isSelected = d.id === selectedId;
    const cls = ["tile", "tile--device", isSelected ? "is-selected" : ""].filter(Boolean).join(" ");
    return `
      <button class="${cls}" data-type="device" data-id="${d.id}">
        <div class="tile-title">${escapeHtml(d.name)}</div>
        ${d.ip ? `<div class="tile-sub">${escapeHtml(d.ip)}</div>` : ``}
      </button>
    `;
  }).join("");
}

function renderStart() {
  // Start: show selectors + Open. Hide devices UI.
  if (elStart) elStart.hidden = false;
  if (elDevicePicker) elDevicePicker.hidden = true;
  elGrid.className = "grid";
  elGrid.innerHTML = "";
  openDrawer(false);
}

function renderDevices() {
  if (elStart) elStart.hidden = true;

  const zone = currentZone();
  if (!zone) {
    setView("start");
    return;
  }

  const devices = zone.devices || [];

  // Desktop: 6x2 grid. Mobile: dropdown.
  elGrid.className = "grid device-grid";

  // Mobile: dropdown device picker. Desktop: grid.
  if (isMobile()) {
    if (elDevicePicker) elDevicePicker.hidden = false;
    if (elDeviceSelect) {
      elDeviceSelect.innerHTML = [
        `<option value="">Select device…</option>`,
        ...devices.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`)
      ].join("");
      elDeviceSelect.value = state.selectedDeviceId ? String(state.selectedDeviceId) : "";
    }
    // no grid in mobile
    elGrid.innerHTML = "";
  } else {
    if (elDevicePicker) elDevicePicker.hidden = true;
    // Build two logical rows (6 cells each) but *render only populated buttons per row*.
    // This keeps row-0 devices on row-0 and row-1 devices on row-1, while omitting EMPTY cells.
    const rows = [Array(6).fill(null), Array(6).fill(null)];
    for (const d of devices) {
      const i = Number(d.posIndex);
      if (!Number.isInteger(i) || i < 0 || i >= 12) continue;
      const r = Math.floor(i / 6);
      const c = i % 6;
      rows[r][c] = d;
    }

    const htmlRows = rows
      .map((row) => {
        const populated = row.filter(Boolean);
        if (!populated.length) return "";
        return (
          `<div class="device-grid-row">` +
          populated
            .map((d) => {
              const isSelected = d.id === state.selectedDeviceId;
              const cls = ["dcell", "assigned", isSelected ? "is-selected" : ""]
                .filter(Boolean)
                .join(" ");
              return `
                <button class="${cls}" data-type="device" data-id="${d.id}">
                  <div class="dcell-label">${escapeHtml(d.name)}</div>
                </button>
              `;
            })
            .join("") +
          `</div>`
        );
      })
      .filter(Boolean);

    elGrid.innerHTML = htmlRows.join("");
  }

  const dev = currentDevice();
  if (!dev) {
    openDrawer(false);
    return;
  }

  openDrawer(true);
}

function render() {
  buildCrumb();

  if (!state.tree) {
    showEmpty("Loading…", "");
    return;
  }

  const categories = state.tree.categories || [];
  if (!categories.length) {
    showEmpty(
      "No zones assigned",
      "Please contact the system admin to assign zones to your user."
    );
    return;
  }

  hideEmpty();

  if (state.view === "start") {
    renderStart();
    return;
  }

  if (state.view === "devices") {
    renderDevices();
    return;
  }
}

function populateCategories() {
  const categories = state.tree?.categories || [];
  if (!elCatSelect) return;

  elCatSelect.innerHTML = categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");

  if (!state.selectedCategoryId && categories[0]) {
    state.selectedCategoryId = categories[0].id;
  }

  if (state.selectedCategoryId) {
    elCatSelect.value = String(state.selectedCategoryId);
  }
}

function populateZonesForSelectedCategory() {
  const cat = currentCategory();
  const zones = cat?.zones || [];
  if (!elZoneSelect) return;

  elZoneSelect.innerHTML = zones.map(z => `<option value="${z.id}">${escapeHtml(z.name)}</option>`).join("");

  // Keep selection if possible
  const stillExists = zones.some(z => z.id === state.selectedZoneId);
  if (!stillExists) {
    state.selectedZoneId = zones[0]?.id || null;
  }

  if (state.selectedZoneId) {
    elZoneSelect.value = String(state.selectedZoneId);
  }
}

function totalZonesCount() {
  const cats = state.tree?.categories || [];
  return cats.reduce((sum, c) => sum + ((c.zones || []).length), 0);
}

function openSelectedZone() {
  // Keep category/zone selection; reset device selection.
  state.selectedDeviceId = null;
  openDrawer(false);
  setView("devices");
}

async function loadTree() {
  setStatus("Loading…");
  const data = await api("/api/user-tree");
  if (!data) return;

  state.tree = data.categories ? data : { categories: [] };

  // Load channels map (names for 1..64)
  try {
    const ch = await api("/api/channels-map");
    state.channelsMap = ch?.channels || [];
  } catch {
    state.channelsMap = [];
  }

  // Init selections: pick first category + first zone automatically.
  const cats = state.tree.categories || [];
  state.selectedCategoryId = cats[0]?.id || null;

  populateCategories();
  populateZonesForSelectedCategory();

  // Auto-enter if only one zone exists in total.
  if (totalZonesCount() === 1) {
    setStatus("Ready");
    openSelectedZone();
    return;
  }

  setStatus("Ready");
  setView("start");
}

async function sendChannelMacro(channelNumber) {
  const dev = currentDevice();
  if (!dev) return;

  const num = Number(channelNumber);
  if (!Number.isInteger(num) || num < 1 || num > 64) {
    setStatus("Invalid channel", true);
    return;
  }

  try {
    setStatus(`Channel ${num}…`);
    const res = await api("/api/channel-macro", {
      method: "POST",
      body: JSON.stringify({ deviceId: dev.id, channelNumber: num }),
    });
    setStatus(res?.message || `Sent channel ${num}`);
  } catch (err) {
    setStatus(err.message || "Macro failed", true);
  }
}

async function sendCommand(cmd) {
  const dev = currentDevice();
  if (!dev) return;

  try {
    setStatus(`Sending ${cmd}…`);
    const res = await api("/api/send", {
      method: "POST",
      body: JSON.stringify({ deviceId: dev.id, command: cmd }),
    });
    setStatus(res?.message || `Sent ${cmd}`);
  } catch (err) {
    setStatus(err.message || "Send failed", true);
  }
}

// ----------------------
// Events
// ----------------------

btnLogout?.addEventListener("click", async () => {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore
  }
  window.location.href = "/login.html";
});

btnBack?.addEventListener("click", () => {
  if (state.view !== "devices") return;
  state.selectedDeviceId = null;
  openDrawer(false);
  setView("start");
});

// Drawer mode buttons
btnModeKeypad?.addEventListener("click", () => setDrawerMode("keypad"));
btnModeChannels?.addEventListener("click", () => setDrawerMode("channels"));

// Channels list click (run macro)
elChannels?.addEventListener("click", (e) => {
  const btn = e.target?.closest?.("button.ch-card");
  if (!btn) return;
  const ch = Number(btn.dataset.ch);
  sendChannelMacro(ch);
});

btnOpen?.addEventListener("click", () => {
  if (!state.selectedZoneId) return;
  openSelectedZone();
});

elCatSelect?.addEventListener("change", () => {
  const id = Number(elCatSelect.value);
  state.selectedCategoryId = id || null;

  // Rebuild zones for this category, select first.
  state.suppressZoneAutoOpen = true;
  state.selectedZoneId = null;
  populateZonesForSelectedCategory();
  render();

  // Allow auto-open on subsequent user-triggered zone changes.
  setTimeout(() => {
    state.suppressZoneAutoOpen = false;
  }, 0);
});

elZoneSelect?.addEventListener("change", () => {
  const id = Number(elZoneSelect.value);
  state.selectedZoneId = id || null;

  render();

  // If user changed the zone manually — open it.
  if (!state.suppressZoneAutoOpen && state.selectedZoneId) {
    openSelectedZone();
  }
});

// About modal (opened by clicking header)
function openAbout(open) {
  if (!elAbout) return;
  elAbout.hidden = !open;
}

elBrandTitle?.addEventListener("click", () => openAbout(true));
btnAboutClose?.addEventListener("click", () => openAbout(false));
elAbout?.addEventListener("click", (e) => {
  const close = e.target?.dataset?.close;
  if (close) openAbout(false);
});

// Mobile device dropdown
elDeviceSelect?.addEventListener("change", () => {
  const id = Number(elDeviceSelect.value);
  state.selectedDeviceId = id || null;
  render();
});

// Re-render on resize so the UI can switch between dropdown and tiles
window.addEventListener("resize", () => {
  if (state.view === "devices") render();
});

// Device tile click (desktop)
elGrid?.addEventListener("click", (e) => {
  // Works for both legacy tiles and the new 6x2 grid buttons.
  const btn = e.target?.closest?.('button[data-type="device"]');
  if (!btn) return;
  const type = btn.dataset.type;
  const id = Number(btn.dataset.id);

  if (type === "device") {
    state.selectedDeviceId = id || null;
    render();
  }
});

// keypad
elKeypad?.addEventListener("click", (e) => {
  const btn = e.target?.closest?.("button.key");
  if (!btn) return;
  const cmd = btn.dataset.cmd;
  if (!cmd) return;
  sendCommand(cmd);
});

// Init
loadTree().catch(err => {
  showEmpty("Error", err.message || "Failed to load data");
  setStatus(err.message || "Failed to load", true);
});
