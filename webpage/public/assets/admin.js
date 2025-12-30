/**
 * admin.js — Admin UI behavior
 * v0.7.5: Categories & Zones tab wired (CRUD + assignment).
 * Next: Devices tab wiring (depends on zones), then Users tab wiring.
 */

const statusEl = document.getElementById("status");
function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
}

async function api(url, options = {}) {
  const res = await fetch(url, { credentials: "include", ...options });
  const data = await res.json().catch(() => ({}));
  // If auth expired, return user to login page.
  if (res.status === 401 || res.status === 403) {
    // Avoid infinite loop if we're already on login.
    if (!window.location.pathname.endsWith("/login.html")) {
      window.location.href = "/login.html";
    }
  }
  return { ok: res.ok, status: res.status, data };
}

function $(id) {
  return document.getElementById(id);
}

function setHint(el, msg, isError = false) {
  if (!el) return;
  el.textContent = msg || "";
  el.style.opacity = msg ? "1" : "0.85";
  el.style.color = isError ? "#ff8a8a" : "";
}

function toInt(val) {
  const n = Number(val);
  return Number.isInteger(n) ? n : NaN;
}

function jsonOptions(method, bodyObj) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyObj || {})
  };
}

/* =========================
   Logout
   ========================= */
const logoutBtn = document.getElementById("btn-logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      window.location.href = "/login.html";
    }
  });
}

/* =========================
   Tabs
   ========================= */
const tabButtons = Array.from(document.querySelectorAll(".nav-tab[data-tab]"));
const panels = Array.from(document.querySelectorAll(".tab-panel[data-panel]"));

function setTab(tabName) {
  tabButtons.forEach(btn => {
    const isActive = btn.dataset.tab === tabName;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });

  panels.forEach(p => {
    const show = p.dataset.panel === tabName;
    p.style.display = show ? "" : "none";
  });

  localStorage.setItem("adminTab", tabName);
  setStatus(`Tab: ${tabName}`);

  // Lazy init wiring for complex tabs
  if (tabName === "catzones") {
    ensureCatZonesInit();
    catZonesReload();
  }
}

tabButtons.forEach(btn => btn.addEventListener("click", () => setTab(btn.dataset.tab)));

const defaultTab = localStorage.getItem("adminTab") || "devices";
setTab(defaultTab);


/* =========================
   Categories & Zones wiring
   ========================= */

const catZonesState = {
  inited: false,
  categories: [],
  zones: [],
  selectedCategoryId: null,
  selectedZoneId: null,
};

function ensureCatZonesInit() {
  if (catZonesState.inited) return;

  // DOM refs (guarded)
  const catList = $("cat-list");
  const zoneList = $("zone-list");
  if (!catList || !zoneList) return; // not on admin page

  // Buttons
  $("btn-cat-reload")?.addEventListener("click", () => catZonesReload());
  $("btn-zone-reload")?.addEventListener("click", () => catZonesReload());

  // Searches
  $("cat-search")?.addEventListener("input", () => renderCatZones());
  $("zone-search")?.addEventListener("input", () => renderCatZones());

  // Badges to clear filter/selection
  $("cat-selected-mini")?.addEventListener("click", () => {
    catZonesState.selectedCategoryId = null;
    // keep zone selection if still visible under All; otherwise cleared by render
    renderCatZones();
  });
  $("zone-filter-badge")?.addEventListener("click", () => {
    catZonesState.selectedCategoryId = null;
    renderCatZones();
  });

  // Add category
  $("btn-cat-add")?.addEventListener("click", async () => {
    const input = $("cat-add-name");
    const note = $("cat-add-note");
    const name = String(input?.value || "").trim();
    if (!name) return setHint(note, "Category name is required", true);

    setHint(note, "Adding...");
    const r = await api("/api/categories", jsonOptions("POST", { name }));
    if (!r.ok) return setHint(note, r.data?.message || "Add failed", true);

    setHint(note, "Category added");
    if (input) input.value = "";
    await catZonesReload({ keepSelection: false, selectCategoryId: r.data?.id || null });
  });

  // Save / Delete category
  $("btn-cat-save")?.addEventListener("click", async () => {
    const note = $("cat-edit-note");
    const cid = catZonesState.selectedCategoryId;
    if (!cid) return setHint(note, "Select a category first", true);

    const name = String($("cat-edit-name")?.value || "").trim();
    if (!name) return setHint(note, "Name is required", true);

    setHint(note, "Saving...");
    const r = await api(`/api/categories/${cid}`, jsonOptions("PUT", { name }));
    if (!r.ok) return setHint(note, r.data?.message || "Save failed", true);

    setHint(note, "Saved");
    await catZonesReload({ keepSelection: true });
  });

  $("btn-cat-delete")?.addEventListener("click", async () => {
    const note = $("cat-edit-note");
    const cid = catZonesState.selectedCategoryId;
    if (!cid) return setHint(note, "Select a category first", true);

    const cat = catZonesState.categories.find(c => c.id === cid);
    const ok = window.confirm(`Delete category "${cat?.name || cid}"?`);
    if (!ok) return;

    setHint(note, "Deleting...");
    const r = await api(`/api/categories/${cid}`, { method: "DELETE" });
    if (!r.ok) return setHint(note, r.data?.message || "Delete failed", true);

    catZonesState.selectedCategoryId = null;
    setHint(note, "Deleted");
    await catZonesReload({ keepSelection: false });
  });

  // Add zone
  $("btn-zone-add")?.addEventListener("click", async () => {
    const input = $("zone-add-name");
    const sel = $("zone-add-category");
    const note = $("zone-add-note");

    const name = String(input?.value || "").trim();
    const categoryId = toInt(sel?.value);

    if (!name) return setHint(note, "Zone name is required", true);
    if (!Number.isInteger(categoryId) || categoryId <= 0) return setHint(note, "Category is required", true);

    setHint(note, "Adding...");
    const r = await api("/api/zones", jsonOptions("POST", { name, categoryId }));
    if (!r.ok) return setHint(note, r.data?.message || "Add failed", true);

    setHint(note, "Zone added");
    if (input) input.value = "";
    // Focus filter on the selected category for immediate visibility
    catZonesState.selectedCategoryId = categoryId;
    await catZonesReload({ keepSelection: true, selectZoneId: r.data?.id || null });
  });

  // Save / Delete zone
  $("btn-zone-save")?.addEventListener("click", async () => {
    const note = $("zone-edit-note");
    const zid = catZonesState.selectedZoneId;
    if (!zid) return setHint(note, "Select a zone first", true);

    const name = String($("zone-edit-name")?.value || "").trim();
    const categoryId = toInt($("zone-edit-category")?.value);
    if (!name) return setHint(note, "Name is required", true);
    if (!Number.isInteger(categoryId) || categoryId <= 0) return setHint(note, "Category is required", true);

    setHint(note, "Saving...");
    const r = await api(`/api/zones/${zid}`, jsonOptions("PUT", { name, categoryId }));
    if (!r.ok) return setHint(note, r.data?.message || "Save failed", true);

    // Keep zone visible after reassignment
    catZonesState.selectedCategoryId = categoryId;

    setHint(note, "Saved");
    await catZonesReload({ keepSelection: true });
  });

  $("btn-zone-delete")?.addEventListener("click", async () => {
    const note = $("zone-edit-note");
    const zid = catZonesState.selectedZoneId;
    if (!zid) return setHint(note, "Select a zone first", true);

    const z = catZonesState.zones.find(x => x.id === zid);
    const ok = window.confirm(`Delete zone "${z?.name || zid}"?`);
    if (!ok) return;

    setHint(note, "Deleting...");
    const r = await api(`/api/zones/${zid}`, { method: "DELETE" });
    if (!r.ok) return setHint(note, r.data?.message || "Delete failed", true);

    catZonesState.selectedZoneId = null;
    setHint(note, "Deleted");
    await catZonesReload({ keepSelection: true });
  });

  // Lists click handling (event delegation)
  catList.addEventListener("click", (e) => {
    const item = e.target?.closest?.(".vitem[data-id]");
    if (!item) return;
    const cid = Number(item.dataset.id);
    if (!Number.isInteger(cid)) return;
    catZonesState.selectedCategoryId = cid;
    // Clear zone selection if it doesn't match filter
    const z = catZonesState.zones.find(x => x.id === catZonesState.selectedZoneId);
    if (z && z.category_id !== cid) catZonesState.selectedZoneId = null;
    renderCatZones();
  });

  zoneList.addEventListener("click", (e) => {
    const item = e.target?.closest?.(".vitem[data-id]");
    if (!item) return;
    const zid = Number(item.dataset.id);
    if (!Number.isInteger(zid)) return;
    catZonesState.selectedZoneId = zid;
    renderCatZones();
  });

  catZonesState.inited = true;
}

async function catZonesReload(opts = {}) {
  if (!catZonesState.inited) return;
  const keepSelection = opts.keepSelection !== false;

  const [cats, zones] = await Promise.all([
    api("/api/categories"),
    api("/api/zones"),
  ]);

  if (!cats.ok) {
    setStatus(cats.data?.message || "Failed loading categories");
    return;
  }
  if (!zones.ok) {
    setStatus(zones.data?.message || "Failed loading zones");
    return;
  }

  catZonesState.categories = cats.data?.categories || [];
  catZonesState.zones = zones.data?.zones || [];

  // Optional selection override
  if (opts.selectCategoryId) catZonesState.selectedCategoryId = Number(opts.selectCategoryId) || null;
  if (opts.selectZoneId) catZonesState.selectedZoneId = Number(opts.selectZoneId) || null;

  // Validate selections still exist
  if (keepSelection) {
    if (catZonesState.selectedCategoryId) {
      const exists = catZonesState.categories.some(c => c.id === catZonesState.selectedCategoryId);
      if (!exists) catZonesState.selectedCategoryId = null;
    }
    if (catZonesState.selectedZoneId) {
      const exists = catZonesState.zones.some(z => z.id === catZonesState.selectedZoneId);
      if (!exists) catZonesState.selectedZoneId = null;
    }
  } else {
    catZonesState.selectedZoneId = null;
  }

  renderCatZones();
}

function renderCatZones() {
  if (!catZonesState.inited) return;

  const catList = $("cat-list");
  const zoneList = $("zone-list");
  if (!catList || !zoneList) return;

  const catSearch = String($("cat-search")?.value || "").trim().toLowerCase();
  const zoneSearch = String($("zone-search")?.value || "").trim().toLowerCase();

  const selectedCat = catZonesState.selectedCategoryId
    ? catZonesState.categories.find(c => c.id === catZonesState.selectedCategoryId)
    : null;

  // Badges
  const mini = $("cat-selected-mini");
  if (mini) mini.textContent = selectedCat?.name || "All";
  const filterBadge = $("zone-filter-badge");
  if (filterBadge) filterBadge.textContent = `Category: ${selectedCat?.name || "All"}`;

  // Category edit section
  const catSelectedBadge = $("cat-selected");
  if (catSelectedBadge) catSelectedBadge.textContent = selectedCat?.name || "None";
  const catEditName = $("cat-edit-name");
  if (catEditName) catEditName.value = selectedCat?.name || "";

  const catSave = $("btn-cat-save");
  const catDelete = $("btn-cat-delete");
  if (catSave) catSave.disabled = !selectedCat;
  if (catDelete) catDelete.disabled = !selectedCat;

  // Populate category dropdowns for zones
  const addSel = $("zone-add-category");
  const editSel = $("zone-edit-category");
  populateCategorySelect(addSel, catZonesState.categories, null);

  // Keep add-zone category selection stable if user already chose
  // (populateCategorySelect preserves current value if still exists)

  // Render categories list
  catList.innerHTML = "";
  const catsToShow = catZonesState.categories
    .filter(c => !catSearch || c.name.toLowerCase().includes(catSearch));

  if (catsToShow.length === 0) {
    const empty = document.createElement("div");
    empty.className = "vitem";
    empty.style.cursor = "default";
    empty.textContent = "No categories";
    catList.appendChild(empty);
  } else {
    for (const c of catsToShow) {
      const row = document.createElement("div");
      row.className = "vitem" + (catZonesState.selectedCategoryId === c.id ? " active" : "");
      row.dataset.id = String(c.id);

      const left = document.createElement("div");
      left.textContent = c.name;

      const right = document.createElement("div");
      right.className = "muted";
      const count = catZonesState.zones.filter(z => z.category_id === c.id).length;
      right.textContent = count ? `${count}` : "";

      row.appendChild(left);
      row.appendChild(right);
      catList.appendChild(row);
    }
  }

  // Zones list (filtered by selected category)
  const zonesToShow = catZonesState.zones
    .filter(z => !selectedCat || z.category_id === selectedCat.id)
    .filter(z => !zoneSearch || z.name.toLowerCase().includes(zoneSearch));

  // If selected zone no longer matches current filter/search, clear selection
  if (catZonesState.selectedZoneId) {
    const stillVisible = zonesToShow.some(z => z.id === catZonesState.selectedZoneId);
    if (!stillVisible) catZonesState.selectedZoneId = null;
  }

  zoneList.innerHTML = "";
  if (zonesToShow.length === 0) {
    const empty = document.createElement("div");
    empty.className = "vitem";
    empty.style.cursor = "default";
    empty.textContent = selectedCat ? "No zones in this category" : "No zones";
    zoneList.appendChild(empty);
  } else {
    for (const z of zonesToShow) {
      const row = document.createElement("div");
      row.className = "vitem" + (catZonesState.selectedZoneId === z.id ? " active" : "");
      row.dataset.id = String(z.id);

      const left = document.createElement("div");
      left.textContent = z.name;

      const right = document.createElement("div");
      right.className = "muted";
      // Only show category name when not filtered
      right.textContent = selectedCat ? "" : (z.category_name || "");

      row.appendChild(left);
      row.appendChild(right);
      zoneList.appendChild(row);
    }
  }

  // Zone edit section
  const selectedZone = catZonesState.selectedZoneId
    ? catZonesState.zones.find(z => z.id === catZonesState.selectedZoneId)
    : null;

  const zoneSelectedBadge = $("zone-selected");
  if (zoneSelectedBadge) zoneSelectedBadge.textContent = selectedZone?.name || "None";
  const zoneEditName = $("zone-edit-name");
  if (zoneEditName) zoneEditName.value = selectedZone?.name || "";

  populateCategorySelect(editSel, catZonesState.categories, selectedZone?.category_id || null);

  const zoneSave = $("btn-zone-save");
  const zoneDelete = $("btn-zone-delete");
  if (zoneSave) zoneSave.disabled = !selectedZone;
  if (zoneDelete) zoneDelete.disabled = !selectedZone;

  // Small UX: if filter is a category, preselect that category in add-zone dropdown (unless user already chose)
  if (addSel && selectedCat) {
    const curr = toInt(addSel.value);
    if (!Number.isInteger(curr) || curr <= 0) {
      addSel.value = String(selectedCat.id);
    }
  }
}

function populateCategorySelect(selectEl, categories, selectedId) {
  if (!selectEl) return;

  const current = selectEl.value;
  selectEl.innerHTML = "";

  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = "Select...";
  selectEl.appendChild(ph);

  for (const c of (categories || [])) {
    const opt = document.createElement("option");
    opt.value = String(c.id);
    opt.textContent = c.name;
    selectEl.appendChild(opt);
  }

  // Prefer explicit selectedId
  if (selectedId) {
    selectEl.value = String(selectedId);
    return;
  }

  // Otherwise try preserve current choice
  if (current) {
    const exists = (categories || []).some(c => String(c.id) === String(current));
    if (exists) selectEl.value = String(current);
  }
}

