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
  };

  // Ip validator
  function isValidIPv4(ip) {
    // Strict IPv4 (no letters / hostnames).
    // 0-255 in each octet. Rejects leading zeros like 001.
    const re = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
    return re.test(String(ip || "").trim());
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

    const selected = state.selectedDeviceId
      ? state.devices.find(d => d.id === state.selectedDeviceId)
      : null;

    populateZoneSelect($("dev-edit-zone"), state.zones, selected?.zone_id || null);

    // Render list
    const search = String($("dev-search")?.value || "").trim().toLowerCase();
    const filtered = (state.devices || [])
      .filter(d => {
        if (!search) return true;
        const n = String(d.name || "").toLowerCase();
        const ip = String(d.ip || "").toLowerCase();
        return n.includes(search) || ip.includes(search);
      })
      .sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { sensitivity: "base" }));

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

    $("btn-dev-reload")?.addEventListener("click", () => reload());
    $("dev-search")?.addEventListener("input", () => render());

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

      if (!state.zones.length) return setHint(note, "Create a zone first", true);
      if (!name) return setHint(note, "Name is required", true);
      if (!ip) return setHint(note, "IP is required", true);
      if (!isValidIPv4(ip)) return setHint(note, "Invalid IP (IPv4 only)", true);
      if (!Number.isInteger(zoneId) || zoneId <= 0) return setHint(note, "Zone is required", true);

      setHint(note, "Adding...");
      const r = await api("/api/add-device", jsonOptions("POST", { name, ip, zoneId }));
      if (!r.ok) return setHint(note, r.data?.message || "Add failed", true);

      setHint(note, "Device added");
      if ($("dev-add-name")) $("dev-add-name").value = "";
      if ($("dev-add-ip")) $("dev-add-ip").value = "";
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
