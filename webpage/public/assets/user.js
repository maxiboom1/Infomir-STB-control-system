/* MAG Control — Regular User UI (v0.8.0)
   Flow: Categories → Zones → Devices tiles + keypad drawer
*/

const elGrid = document.getElementById("grid");
const elEmpty = document.getElementById("empty");
const elEmptyTitle = document.getElementById("empty-title");
const elEmptySub = document.getElementById("empty-sub");
const elCrumb = document.getElementById("crumb");
const btnBack = document.getElementById("btn-back");
const btnLogout = document.getElementById("btn-logout");
const elDrawer = document.getElementById("drawer");
const btnDrawerClose = document.getElementById("btn-drawer-close");
const btnPower = document.querySelector(".key-power");
const elDrawerTitle = document.getElementById("drawer-title");
const elDrawerSub = document.getElementById("drawer-sub");
const elStatus = document.getElementById("status");
const elKeypad = document.getElementById("keypad");

const state = {
  tree: null,
  view: "categories", // categories | zones | devices
  selectedCategoryId: null,
  selectedZoneId: null,
  selectedDeviceId: null,
};

function setStatus(msg, isError = false) {
  if (!elStatus) return;
  elStatus.textContent = msg || "";
  elStatus.style.color = isError ? "#ff3b30" : "";
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
  elDrawer.dataset.open = open ? "true" : "false";
  if (btnDrawerClose) btnDrawerClose.textContent = open ? "Hide" : "Show";
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
  const parts = ["Categories"];
  const cat = currentCategory();
  if (cat) parts.push(cat.name);
  const zone = currentZone();
  if (zone) parts.push(zone.name);
  elCrumb.textContent = parts.join(" / ");

  // Back button rules
  btnBack.disabled = (state.view === "categories");
}

function showEmpty(title, sub) {
  elGrid.innerHTML = "";
  elEmptyTitle.textContent = title || "Empty";
  elEmptySub.textContent = sub || "";
  elEmpty.hidden = false;
}

function hideEmpty() {
  elEmpty.hidden = true;
}

function renderTiles(items, type) {
  // type: category | zone | device
  const selectedId = type === "category"
    ? state.selectedCategoryId
    : type === "zone"
      ? state.selectedZoneId
      : state.selectedDeviceId;

  elGrid.innerHTML = items.map(item => {
    const isSelected = item.id === selectedId;
    const cls = ["tile", `tile--${type}`, isSelected ? "is-selected" : ""].filter(Boolean).join(" ");
    const sub = (type === "device") ? (item.ip ? escapeHtml(item.ip) : "") : "";

    return `
      <button class="${cls}" data-type="${type}" data-id="${item.id}">
        <div class="tile-title">${escapeHtml(item.name)}</div>
        ${sub ? `<div class="tile-sub">${sub}</div>` : ``}
      </button>
    `;
  }).join("");
}

function render() {
  buildCrumb();

  if (!state.tree) {
    showEmpty("Loading…", "");
    return;
  }

  const categories = state.tree.categories || [];

  // no access
  if (!categories.length) {
    showEmpty(
      "No zones assigned",
      "Please contact the system admin to assign zones to your user."
    );
    openDrawer(false);
    return;
  }

  hideEmpty();

  if (state.view === "categories") {
    elGrid.className = "grid";
    // Drawer should be hidden on categories
    openDrawer(false);
    if (btnPower) btnPower.disabled = true;
    state.selectedZoneId = null;
    state.selectedDeviceId = null;
    renderTiles(categories, "category");
    return;
  }

  if (state.view === "zones") {
    elGrid.className = "grid";
    openDrawer(false);
    if (btnPower) btnPower.disabled = true;
    state.selectedDeviceId = null;

    const cat = currentCategory();
    if (!cat) {
      // fallback
      state.selectedCategoryId = categories[0].id;
      return render();
    }

    renderTiles(cat.zones || [], "zone");
    return;
  }

  if (state.view === "devices") {
    elGrid.className = "grid device-row";
    const zone = currentZone();
    if (!zone) {
      // fallback
      setView("zones");
      return;
    }

    renderTiles(zone.devices || [], "device");

    // Drawer shows only when a device is selected
    const dev = currentDevice();
    if (!dev) {
      elDrawerTitle.textContent = "Select a device";
      elDrawerSub.textContent = "";
      openDrawer(false);
      if (btnPower) btnPower.disabled = true;
      return;
    }

    elDrawerTitle.textContent = dev.name;
    elDrawerSub.textContent = `${currentCategory()?.name || ""} / ${zone.name}`;
    openDrawer(true);
    if (btnPower) btnPower.disabled = false;
    return;
  }
}

async function loadTree() {
  setStatus("Loading…");
  const data = await api("/api/user-tree");
  if (!data) return;

  state.tree = data.categories ? data : { categories: [] };

  // Decide initial view:
  // If only 1 category → skip categories and show zones directly (even if only one zone)
  if (state.tree.categories?.length === 1) {
    state.selectedCategoryId = state.tree.categories[0].id;
    state.view = "zones";
  } else {
    state.view = "categories";
  }

  // Keep CSS layout in sync with current view
  document.body.dataset.view = state.view;

  document.body.dataset.view = state.view;

  setStatus("Ready");
  render();
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
  if (state.view === "devices") {
    state.selectedDeviceId = null;
    openDrawer(false);
    setView("zones");
    return;
  }
  if (state.view === "zones") {
    // If only one category exists, keep user in zones view (no point to go back)
    if (state.tree?.categories?.length === 1) return;

    state.selectedCategoryId = null;
    state.selectedZoneId = null;
    setView("categories");
    return;
  }
});

btnDrawerClose?.addEventListener("click", () => {
  const isOpen = elDrawer?.dataset?.open === "true";
  openDrawer(!isOpen);
});

// Power button lives in drawer header (outside keypad container)
btnPower?.addEventListener("click", () => {
  if (btnPower.disabled) return;
  sendCommand("POWER");
});

elGrid?.addEventListener("click", (e) => {
  const btn = e.target?.closest?.("button.tile");
  if (!btn) return;
  const type = btn.dataset.type;
  const id = Number(btn.dataset.id);

  if (type === "category") {
    state.selectedCategoryId = id;
    state.selectedZoneId = null;
    state.selectedDeviceId = null;
    setView("zones");
    return;
  }

  if (type === "zone") {
    state.selectedZoneId = id;
    state.selectedDeviceId = null;
    setView("devices");
    return;
  }

  if (type === "device") {
    state.selectedDeviceId = id;
    render();
    return;
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
