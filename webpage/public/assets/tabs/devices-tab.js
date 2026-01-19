/**
 * devices-tab.js — Devices tab wiring
 *
 * Device belongs to Zone only. Category is derived from Zone.
 *
 * Endpoints used:
 * - GET    /api/zones
 * - GET    /api/devices-detailed
 * - POST   /api/add-device
 * - PUT    /api/device/:id
 * - DELETE /api/device/:id
 */

export function initDevicesTab(shared) {
  const { $, api, setStatus, setHint, toInt, jsonOptions } = shared;

  const state = {
    inited: false,
    zones: [],
    devices: [],
    selectedDeviceId: null,

    // Add form: chosen grid cell (0..11)
    addPosIndex: null,
    addZoneId: null,

    // Filter UI (in-memory only; reset on page refresh)
    filterZoneId: null, // null => all
  };

  const GRID_CELLS = 12; // 6x2

  // Ip validator
  function isValidIPv4(ip) {
    // Strict IPv4 (no letters / hostnames).
    // 0-255 in each octet. Rejects leading zeros like 001.
    const re = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
    return re.test(String(ip || "").trim());
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function groupZonesByCategory(zones) {
    const map = new Map();
    for (const z of zones || []) {
      const key = z.category_name || "(No category)";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(z);
    }

    const entries = Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: "base" }));

    for (const [, arr] of entries) {
      arr.sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { sensitivity: "base" }));
    }
    return entries;
  }

  function populateZoneSelect(selectEl, zones, selectedId) {
    if (!selectEl) return;

    const current = selectEl.value;
    selectEl.innerHTML = "";

    const ph = document.createElement("option");
    ph.value = "";
    ph.textContent = (zones && zones.length) ? "Select..." : "No zones";
    selectEl.appendChild(ph);

    for (const [catName, arr] of groupZonesByCategory(zones)) {
      const og = document.createElement("optgroup");
      og.label = catName;
      for (const z of arr) {
        const opt = document.createElement("option");
        opt.value = String(z.id);
        opt.textContent = z.name;
        og.appendChild(opt);
      }
      selectEl.appendChild(og);
    }

    // Prefer explicit selectedId
    if (selectedId) {
      selectEl.value = String(selectedId);
      return;
    }

    // Otherwise preserve current if still valid
    if (current) {
      const exists = (zones || []).some(z => String(z.id) === String(current));
      if (exists) selectEl.value = String(current);
    }
  }

  function setDevicesEnabled(enabled) {
    const ids = [
      "dev-add-name",
      "dev-add-ip",
      "dev-add-zone",
      "btn-dev-create",
      "dev-edit-name",
      "dev-edit-ip",
      "dev-edit-zone",
      "btn-dev-save",
      "btn-dev-delete",
      "btn-dev-reload",
    ];

    for (const id of ids) {
      const el = $(id);
      if (!el) continue;
      el.disabled = !enabled;
    }
  }

  /* =========================
     Grid helpers (6x2)
     ========================= */

  function devicesInZone(zoneId) {
    const zid = Number(zoneId);
    if (!Number.isInteger(zid) || zid <= 0) return [];
    return (state.devices || []).filter(d => Number(d.zone_id) === zid && Number.isInteger(d.pos_index));
  }

  function buildZoneCells(zoneId) {
    const cells = Array.from({ length: GRID_CELLS }, () => null);
    for (const d of devicesInZone(zoneId)) {
      const i = Number(d.pos_index);
      if (Number.isInteger(i) && i >= 0 && i < GRID_CELLS) {
        cells[i] = d;
      }
    }
    return cells;
  }

  function renderGrid(containerEl, zoneId, opts = {}) {
    if (!containerEl) return;

    const selectedDeviceId = opts.selectedDeviceId ?? null;
    const allowClickEmpty = !!opts.allowClickEmpty;
    const showNewOnIndex = Number.isInteger(opts.newPosIndex) ? opts.newPosIndex : null;

    const cells = buildZoneCells(zoneId);

    containerEl.innerHTML = cells.map((d, idx) => {
      const isAssigned = !!d;
      const isSelected = isAssigned && (Number(d.id) === Number(selectedDeviceId));
      const isNew = (!isAssigned && showNewOnIndex === idx);

      const cls = [
        "stb-cell",
        isAssigned ? "assigned" : "empty",
        isSelected ? "is-selected" : "",
      ].filter(Boolean).join(" ");

      const deviceIdAttr = isAssigned ? `data-device-id="${d.id}"` : "";
      const clickable = (!isAssigned && allowClickEmpty) ? "data-click-empty=\"1\"" : "";

      const label = isAssigned ? escapeHtml(d.name || "") : (isNew ? "NEW" : "EMPTY");
      const labelCls = isAssigned ? "" : (isNew ? "" : "empty");

      return `
        <div class="${cls}" data-pos-index="${idx}" ${deviceIdAttr} ${clickable}>
          <div class="cell-index">${idx + 1}</div>
          <div class="stb-tile" ${isAssigned ? "draggable=\"true\"" : ""} ${isAssigned ? `data-drag-id=\"${d.id}\"` : ""}>
            <div class="cell-label ${labelCls}">${label}</div>
          </div>
          ${isNew ? `<div class="cell-sub new">new</div>` : ``}
        </div>
      `;
    }).join("");
  }

  function getVisibleDevices() {
    const search = String($("dev-search")?.value || "").trim().toLowerCase();
    const zf = state.filterZoneId;

    return (state.devices || [])
      .filter(d => {
        if (zf && Number(d.zone_id) !== zf) return false;
        if (!search) return true;
        const n = String(d.name || "").toLowerCase();
        const ip = String(d.ip || "").toLowerCase();
        return n.includes(search) || ip.includes(search);
      });
  }

  function populateZoneFilterSelect(selectEl, zones, selectedId) {
    if (!selectEl) return;

    const want = selectedId ? String(selectedId) : "";
    selectEl.innerHTML = "";

    const all = document.createElement("option");
    all.value = "";
    all.textContent = "All zones";
    selectEl.appendChild(all);

    if (!zones || zones.length === 0) {
      selectEl.value = "";
      return;
    }

    // Keep filter list simple: zone names only (no category grouping).
    const sorted = [...zones].sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { sensitivity: "base" }));
    for (const z of sorted) {
      const opt = document.createElement("option");
      opt.value = String(z.id);
      opt.textContent = z.name;
      selectEl.appendChild(opt);
    }

    // Restore selection if still valid
    selectEl.value = want;
    if (want && selectEl.value !== want) {
      // selection not present anymore
      selectEl.value = "";
    }
  }

  function renderZoneFilter() {
    populateZoneFilterSelect($("dev-zone-filter"), state.zones, state.filterZoneId);
  }

  function render() {
    if (!state.inited) return;

    const listEl = $("dev-list");
    if (!listEl) return;

    const zonesExist = (state.zones || []).length > 0;
    setDevicesEnabled(zonesExist);

    const addNote = $("dev-add-note");
    if (!zonesExist) {
      setHint(addNote, "Create at least one category + zone first", true);
    }

    // Populate dropdowns
    populateZoneSelect($("dev-add-zone"), state.zones, null);

    // Add grid (based on current add-zone selection)
    const addZoneId = toInt($("dev-add-zone")?.value);
    if (addZoneId !== state.addZoneId) {
      state.addZoneId = Number.isInteger(addZoneId) ? addZoneId : null;
      state.addPosIndex = null; // reset selection on zone change
    }
    renderGrid($("dev-add-grid"), state.addZoneId, {
      allowClickEmpty: true,
      newPosIndex: state.addPosIndex,
    });
    const addPosBadge = $("dev-add-pos");
    if (addPosBadge) addPosBadge.textContent = Number.isInteger(state.addPosIndex) ? String(state.addPosIndex + 1) : "None";

    const selected = state.selectedDeviceId
      ? state.devices.find(d => d.id === state.selectedDeviceId)
      : null;

    populateZoneSelect($("dev-edit-zone"), state.zones, selected?.zone_id || null);

    // Edit grid (by the selected edit-zone)
    const editZoneId = toInt($("dev-edit-zone")?.value) || selected?.zone_id || null;
    renderGrid($("dev-edit-grid"), editZoneId, {
      selectedDeviceId: selected?.id || null,
    });

    // Filter controls
    renderZoneFilter();

    // Render list
    const filtered = getVisibleDevices()
      .sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { sensitivity: "base" }));

    if (state.selectedDeviceId && !filtered.some(d => d.id === state.selectedDeviceId)) {
      state.selectedDeviceId = null;
    }

    listEl.innerHTML = "";
    if (filtered.length === 0) {
      const empty = document.createElement("div");
      empty.className = "vitem";
      empty.style.cursor = "default";
      empty.textContent = "No devices";
      listEl.appendChild(empty);
    } else {
      for (const d of filtered) {
        const row = document.createElement("div");
        row.className = "vitem" + (state.selectedDeviceId === d.id ? " active" : "");
        row.dataset.id = String(d.id);

        const left = document.createElement("div");
        left.textContent = d.name;

        const right = document.createElement("div");
        right.className = "muted";
        right.textContent = d.zone_name || "";

        row.appendChild(left);
        row.appendChild(right);
        listEl.appendChild(row);
      }
    }

    // If selection is not visible under current search, clear
    if (state.selectedDeviceId && !filtered.some(d => d.id === state.selectedDeviceId)) {
      state.selectedDeviceId = null;
    }

    // Fill edit fields
    const badge = $("dev-selected");
    if (badge) badge.textContent = selected?.name || "None";

    const editName = $("dev-edit-name");
    if (editName) editName.value = selected?.name || "";

    const editIp = $("dev-edit-ip");
    if (editIp) editIp.value = selected?.ip || "";

    const saveBtn = $("btn-dev-save");
    const delBtn = $("btn-dev-delete");
    if (saveBtn) saveBtn.disabled = !zonesExist || !selected;
    if (delBtn) delBtn.disabled = !zonesExist || !selected;
  }

  async function reload(opts = {}) {
    if (!state.inited) return;

    const keepSelection = opts.keepSelection !== false;

    const [zonesRes, devicesRes] = await Promise.all([
      api("/api/zones"),
      api("/api/devices-detailed"),
    ]);

    state.zones = zonesRes.ok ? (zonesRes.data?.zones || []) : [];
    state.devices = devicesRes.ok ? (devicesRes.data?.devices || []) : [];

    if (!zonesRes.ok) setStatus(zonesRes.data?.message || "Failed loading zones");
    if (!devicesRes.ok) setStatus(devicesRes.data?.message || "Failed loading devices");

    if (opts.selectDeviceId) state.selectedDeviceId = Number(opts.selectDeviceId) || null;

    if (keepSelection && state.selectedDeviceId) {
      const exists = state.devices.some(d => d.id === state.selectedDeviceId);
      if (!exists) state.selectedDeviceId = null;
    }

    render();
  }

  function initOnce() {
    if (state.inited) return;

    const listEl = $("dev-list");
    if (!listEl) return; // not on admin page

    const addGridEl = $("dev-add-grid");
    const editGridEl = $("dev-edit-grid");

    $("dev-add-zone")?.addEventListener("change", () => {
      state.addPosIndex = null;
      render();
    });

    addGridEl?.addEventListener("click", (e) => {
      const cell = e.target?.closest?.(".stb-cell[data-click-empty=\"1\"]");
      if (!cell) return;
      const idx = toInt(cell.dataset.posIndex);
      if (!Number.isInteger(idx) || idx < 0 || idx >= GRID_CELLS) return;
      state.addPosIndex = idx;
      render();
    });

    // Drag & drop swap/move in edit grid
    let dragDeviceId = null;
    editGridEl?.addEventListener("dragstart", (e) => {
      const tile = e.target?.closest?.(".stb-tile[draggable=\"true\"]");
      if (!tile) return;
      const id = toInt(tile.dataset.dragId);
      if (!Number.isInteger(id) || id <= 0) return;
      dragDeviceId = id;
      try { e.dataTransfer.setData("text/plain", String(id)); } catch {}
    });

    editGridEl?.addEventListener("dragend", () => { dragDeviceId = null; });

    function setDropHover(cell, on) {
      if (!cell) return;
      cell.classList.toggle("drop-hover", !!on);
    }

    editGridEl?.addEventListener("dragover", (e) => {
      const cell = e.target?.closest?.(".stb-cell[data-pos-index]");
      if (!cell) return;
      e.preventDefault(); // allow drop
    });

    editGridEl?.addEventListener("dragenter", (e) => {
      const cell = e.target?.closest?.(".stb-cell[data-pos-index]");
      if (!cell) return;
      setDropHover(cell, true);
    });

    editGridEl?.addEventListener("dragleave", (e) => {
      const cell = e.target?.closest?.(".stb-cell[data-pos-index]");
      if (!cell) return;
      setDropHover(cell, false);
    });

    editGridEl?.addEventListener("drop", async (e) => {
      e.preventDefault();
      const cell = e.target?.closest?.(".stb-cell[data-pos-index]");
      if (!cell) return;
      setDropHover(cell, false);

      const srcId = dragDeviceId || toInt(e.dataTransfer?.getData?.("text/plain"));
      if (!Number.isInteger(srcId) || srcId <= 0) return;

      const dstDeviceId = toInt(cell.dataset.deviceId);
      const dstPosIndex = toInt(cell.dataset.posIndex);
      if (!Number.isInteger(dstPosIndex) || dstPosIndex < 0 || dstPosIndex >= GRID_CELLS) return;

      // Swap if dropping onto another device
      if (Number.isInteger(dstDeviceId) && dstDeviceId > 0 && dstDeviceId !== srcId) {
        setStatus("Swapping positions...");
        const r = await api("/api/device-swap", jsonOptions("POST", { aId: srcId, bId: dstDeviceId }));
        if (!r.ok) return setStatus(r.data?.message || "Swap failed");
        setStatus("Positions swapped");
        await reload({ keepSelection: true });
        return;
      }

      // Move to empty cell
      setStatus("Moving device...");
      const r = await api(`/api/device/${srcId}`, jsonOptions("PUT", { posIndex: dstPosIndex }));
      if (!r.ok) return setStatus(r.data?.message || "Move failed");
      setStatus("Device moved");
      await reload({ keepSelection: true });
    });

    $("btn-dev-reload")?.addEventListener("click", () => reload());
    $("dev-search")?.addEventListener("input", () => render());

    $("dev-zone-filter")?.addEventListener("change", () => {
      const v = String($("dev-zone-filter")?.value || "");
      const id = toInt(v);
      state.filterZoneId = (id && id > 0) ? id : null;
      // If current selection is not in filtered set, clear it
      const sel = state.selectedDeviceId;
      if (sel && !getVisibleDevices().some(d => d.id === sel)) {
        state.selectedDeviceId = null;
      }
      render();
    });

    // Select device
    listEl.addEventListener("click", (e) => {
      const item = e.target?.closest?.(".vitem[data-id]");
      if (!item) return;
      const id = Number(item.dataset.id);
      if (!Number.isInteger(id)) return;
      state.selectedDeviceId = id;
      render();
    });

    // Add device
    $("btn-dev-create")?.addEventListener("click", async () => {
      const note = $("dev-add-note");

      const name = String($("dev-add-name")?.value || "").trim();
      const ip = String($("dev-add-ip")?.value || "").trim();
      const zoneId = toInt($("dev-add-zone")?.value);
      const posIndex = state.addPosIndex;

      if (!state.zones.length) return setHint(note, "Create a zone first", true);
      if (!name) return setHint(note, "Name is required", true);
      if (!ip) return setHint(note, "IP is required", true);
      if (!isValidIPv4(ip)) return setHint(note, "Invalid IP (IPv4 only)", true);
      if (!Number.isInteger(zoneId) || zoneId <= 0) return setHint(note, "Zone is required", true);
      if (!Number.isInteger(posIndex) || posIndex < 0 || posIndex >= GRID_CELLS) return setHint(note, "Click an empty grid cell to pick a position", true);

      setHint(note, "Adding...");
      const r = await api("/api/add-device", jsonOptions("POST", { name, ip, zoneId, posIndex }));
      if (!r.ok) return setHint(note, r.data?.message || "Add failed", true);

      setHint(note, "Device added");
      if ($("dev-add-name")) $("dev-add-name").value = "";
      if ($("dev-add-ip")) $("dev-add-ip").value = "";
      state.addPosIndex = null;
      await reload({ keepSelection: false, selectDeviceId: r.data?.id || null });
    });

    // Save device
    $("btn-dev-save")?.addEventListener("click", async () => {
      const id = state.selectedDeviceId;
      if (!id) return setStatus("Select a device first");

      const name = String($("dev-edit-name")?.value || "").trim();
      const ip = String($("dev-edit-ip")?.value || "").trim();
      const zoneId = toInt($("dev-edit-zone")?.value);

      if (!state.zones.length) return setStatus("Create a zone first");
      if (!name) return setStatus("Name is required");
      if (!ip) return setStatus("IP is required");
      if (!isValidIPv4(ip)) return setStatus("Invalid IP (IPv4 only)");
      if (!Number.isInteger(zoneId) || zoneId <= 0) return setStatus("Zone is required");

      setStatus("Saving device...");
      const r = await api(`/api/device/${id}`, jsonOptions("PUT", { name, ip, zoneId }));
      if (!r.ok) return setStatus(r.data?.message || "Save failed");

      setStatus("Device saved");
      await reload({ keepSelection: true });
    });

    // Delete device
    $("btn-dev-delete")?.addEventListener("click", async () => {
      const id = state.selectedDeviceId;
      if (!id) return setStatus("Select a device first");
      const dev = state.devices.find(d => d.id === id);
      const ok = window.confirm(`Delete device "${dev?.name || id}"?`);
      if (!ok) return;

      setStatus("Deleting device...");
      const r = await api(`/api/device/${id}`, { method: "DELETE" });
      if (!r.ok) return setStatus(r.data?.message || "Delete failed");

      state.selectedDeviceId = null;
      setStatus("Device deleted");
      await reload({ keepSelection: false });
    });

    state.inited = true;
  }

  return {
    async onShow() {
      initOnce();
      if (!state.inited) return;
      await reload();
      setStatus("Devices ready");
    },
  };
}
