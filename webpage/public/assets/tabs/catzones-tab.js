/**
 * catzones-tab.js — Categories & Zones tab wiring
 *
 * v0.7.7: extracted from admin.js into ES module.
 */

export function initCatZonesTab(shared) {
  const { $, api, setStatus, setHint, toInt, jsonOptions } = shared;

  const state = {
    inited: false,
    categories: [],
    zones: [],
    selectedCategoryId: null,
    selectedZoneId: null,
  };

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

  function render() {
    if (!state.inited) return;

    const catList = $("cat-list");
    const zoneList = $("zone-list");
    if (!catList || !zoneList) return;

    const catSearch = String($("cat-search")?.value || "").trim().toLowerCase();
    const zoneSearch = String($("zone-search")?.value || "").trim().toLowerCase();

    const selectedCat = state.selectedCategoryId
      ? state.categories.find(c => c.id === state.selectedCategoryId)
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
    populateCategorySelect(addSel, state.categories, null);

    // Render categories list
    catList.innerHTML = "";
    const catsToShow = state.categories
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
        row.className = "vitem" + (state.selectedCategoryId === c.id ? " active" : "");
        row.dataset.id = String(c.id);

        const left = document.createElement("div");
        left.textContent = c.name;

        const right = document.createElement("div");
        right.className = "muted";
        const count = state.zones.filter(z => z.category_id === c.id).length;
        right.textContent = count ? `${count}` : "";

        row.appendChild(left);
        row.appendChild(right);
        catList.appendChild(row);
      }
    }

    // Zones list (filtered by selected category)
    const zonesToShow = state.zones
      .filter(z => !selectedCat || z.category_id === selectedCat.id)
      .filter(z => !zoneSearch || z.name.toLowerCase().includes(zoneSearch));

    // If selected zone no longer matches current filter/search, clear selection
    if (state.selectedZoneId) {
      const stillVisible = zonesToShow.some(z => z.id === state.selectedZoneId);
      if (!stillVisible) state.selectedZoneId = null;
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
        row.className = "vitem" + (state.selectedZoneId === z.id ? " active" : "");
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
    const selectedZone = state.selectedZoneId
      ? state.zones.find(z => z.id === state.selectedZoneId)
      : null;

    const zoneSelectedBadge = $("zone-selected");
    if (zoneSelectedBadge) zoneSelectedBadge.textContent = selectedZone?.name || "None";
    const zoneEditName = $("zone-edit-name");
    if (zoneEditName) zoneEditName.value = selectedZone?.name || "";

    populateCategorySelect(editSel, state.categories, selectedZone?.category_id || null);

    const zoneSave = $("btn-zone-save");
    const zoneDelete = $("btn-zone-delete");
    if (zoneSave) zoneSave.disabled = !selectedZone;
    if (zoneDelete) zoneDelete.disabled = !selectedZone;

    // UX: if filter is a category, preselect that category in add-zone dropdown (unless user already chose)
    if (addSel && selectedCat) {
      const curr = toInt(addSel.value);
      if (!Number.isInteger(curr) || curr <= 0) {
        addSel.value = String(selectedCat.id);
      }
    }
  }

  async function reload(opts = {}) {
    if (!state.inited) return;
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

    state.categories = cats.data?.categories || [];
    state.zones = zones.data?.zones || [];

    // Optional selection override
    if (opts.selectCategoryId) state.selectedCategoryId = Number(opts.selectCategoryId) || null;
    if (opts.selectZoneId) state.selectedZoneId = Number(opts.selectZoneId) || null;

    // Validate selections still exist
    if (keepSelection) {
      if (state.selectedCategoryId) {
        const exists = state.categories.some(c => c.id === state.selectedCategoryId);
        if (!exists) state.selectedCategoryId = null;
      }
      if (state.selectedZoneId) {
        const exists = state.zones.some(z => z.id === state.selectedZoneId);
        if (!exists) state.selectedZoneId = null;
      }
    } else {
      state.selectedZoneId = null;
    }

    render();
  }

  function initOnce() {
    if (state.inited) return;

    // DOM refs (guarded)
    const catList = $("cat-list");
    const zoneList = $("zone-list");
    if (!catList || !zoneList) return;

    // Buttons
    $("btn-cat-reload")?.addEventListener("click", () => reload());
    // "Show all": clear category filter (keeps search text)
    $("btn-zone-reload")?.addEventListener("click", () => {
      state.selectedCategoryId = null;
      render();
    });

    // Searches
    $("cat-search")?.addEventListener("input", () => render());
    $("zone-search")?.addEventListener("input", () => render());

    // Badges to clear filter/selection
    $("cat-selected-mini")?.addEventListener("click", () => {
      state.selectedCategoryId = null;
      render();
    });
    $("zone-filter-badge")?.addEventListener("click", () => {
      state.selectedCategoryId = null;
      render();
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
      await reload({ keepSelection: false, selectCategoryId: r.data?.id || null });
    });

    // Save / Delete category
    $("btn-cat-save")?.addEventListener("click", async () => {
      const note = $("cat-edit-note");
      const cid = state.selectedCategoryId;
      if (!cid) return setHint(note, "Select a category first", true);

      const name = String($("cat-edit-name")?.value || "").trim();
      if (!name) return setHint(note, "Name is required", true);

      setHint(note, "Saving...");
      const r = await api(`/api/categories/${cid}`, jsonOptions("PUT", { name }));
      if (!r.ok) return setHint(note, r.data?.message || "Save failed", true);

      setHint(note, "Saved");
      await reload({ keepSelection: true });
    });

    $("btn-cat-delete")?.addEventListener("click", async () => {
      const note = $("cat-edit-note");
      const cid = state.selectedCategoryId;
      if (!cid) return setHint(note, "Select a category first", true);

      const cat = state.categories.find(c => c.id === cid);
      const ok = window.confirm(`Delete category "${cat?.name || cid}"?`);
      if (!ok) return;

      setHint(note, "Deleting...");
      const r = await api(`/api/categories/${cid}`, { method: "DELETE" });
      if (!r.ok) return setHint(note, r.data?.message || "Delete failed", true);

      state.selectedCategoryId = null;
      setHint(note, "Deleted");
      await reload({ keepSelection: false });
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
      state.selectedCategoryId = categoryId;
      await reload({ keepSelection: true, selectZoneId: r.data?.id || null });
    });

    // Save / Delete zone
    $("btn-zone-save")?.addEventListener("click", async () => {
      const note = $("zone-edit-note");
      const zid = state.selectedZoneId;
      if (!zid) return setHint(note, "Select a zone first", true);

      const name = String($("zone-edit-name")?.value || "").trim();
      const categoryId = toInt($("zone-edit-category")?.value);
      if (!name) return setHint(note, "Name is required", true);
      if (!Number.isInteger(categoryId) || categoryId <= 0) return setHint(note, "Category is required", true);

      setHint(note, "Saving...");
      const r = await api(`/api/zones/${zid}`, jsonOptions("PUT", { name, categoryId }));
      if (!r.ok) return setHint(note, r.data?.message || "Save failed", true);

      state.selectedCategoryId = categoryId;

      setHint(note, "Saved");
      await reload({ keepSelection: true });
    });

    $("btn-zone-delete")?.addEventListener("click", async () => {
      const note = $("zone-edit-note");
      const zid = state.selectedZoneId;
      if (!zid) return setHint(note, "Select a zone first", true);

      const z = state.zones.find(x => x.id === zid);
      const ok = window.confirm(`Delete zone "${z?.name || zid}"?`);
      if (!ok) return;

      setHint(note, "Deleting...");
      const r = await api(`/api/zones/${zid}`, { method: "DELETE" });
      if (!r.ok) return setHint(note, r.data?.message || "Delete failed", true);

      state.selectedZoneId = null;
      setHint(note, "Deleted");
      await reload({ keepSelection: true });
    });

    // Lists click handling (event delegation)
    catList.addEventListener("click", (e) => {
      const item = e.target?.closest?.(".vitem[data-id]");
      if (!item) return;
      const cid = Number(item.dataset.id);
      if (!Number.isInteger(cid)) return;
      state.selectedCategoryId = cid;
      const z = state.zones.find(x => x.id === state.selectedZoneId);
      if (z && z.category_id !== cid) state.selectedZoneId = null;
      render();
    });

    zoneList.addEventListener("click", (e) => {
      const item = e.target?.closest?.(".vitem[data-id]");
      if (!item) return;
      const zid = Number(item.dataset.id);
      if (!Number.isInteger(zid)) return;
      state.selectedZoneId = zid;
      render();
    });

    state.inited = true;
  }

  return {
    async onShow() {
      initOnce();
      if (!state.inited) return;
      await reload();
      setStatus("Categories & Zones ready");
    },
  };
}
