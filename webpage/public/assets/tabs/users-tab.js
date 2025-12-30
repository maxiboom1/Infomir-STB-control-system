/**
 * users-tab.js — Users tab wiring
 *
 * Endpoints used:
 * - GET    /api/users
 * - POST   /api/users
 * - PUT    /api/users/:id
 * - DELETE /api/users/:id
 * - GET    /api/zones
 * - GET    /api/users/:id/zones
 * - PUT    /api/users/:id/zones
 */

export function initUsersTab(shared) {
  const { $, api, setStatus, setHint, toInt, jsonOptions } = shared;

  const state = {
    inited: false,
    users: [],
    zones: [],
    selectedUserId: null,
    // assignment state (for selected user)
    assignedZoneIds: [],
    selectedAvailZoneId: null,
    selectedAssignedZoneId: null,
  };

  function findUser(id) {
    return (state.users || []).find(u => u.id === id) || null;
  }

  function zoneDisplay(z) {
    const cn = z.category_name ? String(z.category_name) : "";
    return cn ? `${cn} / ${z.name}` : String(z.name || "");
  }

  function renderUserList() {
    const listEl = $("user-list");
    if (!listEl) return;

    const search = String($("user-search")?.value || "").trim().toLowerCase();
    const filtered = (state.users || [])
      .filter(u => {
        if (!search) return true;
        const name = String(u.username || "").toLowerCase();
        return name.includes(search);
      })
      .sort((a, b) => String(a.username).localeCompare(String(b.username), undefined, { sensitivity: "base" }));

    listEl.innerHTML = "";
    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "vitem";
      empty.style.cursor = "default";
      empty.textContent = "No users";
      listEl.appendChild(empty);
      return;
    }

    for (const u of filtered) {
      const row = document.createElement("div");
      row.className = "vitem" + (state.selectedUserId === u.id ? " active" : "");
      row.dataset.id = String(u.id);

      const left = document.createElement("div");
      left.textContent = u.username;

      const right = document.createElement("div");
      right.className = "muted";
      right.textContent = ""; // role is internal and not shown in UI

      row.appendChild(left);
      row.appendChild(right);
      listEl.appendChild(row);
    }
  }

  function renderAssignmentLists() {
    const availEl = $("uz-available");
    const asgEl = $("uz-assigned");
    if (!availEl || !asgEl) return;

    const zones = state.zones || [];
    const assignedSet = new Set((state.assignedZoneIds || []).map(Number));

    const available = zones
      .filter(z => !assignedSet.has(Number(z.id)))
      .slice()
      .sort((a, b) => zoneDisplay(a).localeCompare(zoneDisplay(b), undefined, { sensitivity: "base" }));

    const assigned = zones
      .filter(z => assignedSet.has(Number(z.id)))
      .slice()
      .sort((a, b) => zoneDisplay(a).localeCompare(zoneDisplay(b), undefined, { sensitivity: "base" }));

    // Keep selected zone ids valid
    if (state.selectedAvailZoneId && !available.some(z => Number(z.id) === state.selectedAvailZoneId)) {
      state.selectedAvailZoneId = null;
    }
    if (state.selectedAssignedZoneId && !assigned.some(z => Number(z.id) === state.selectedAssignedZoneId)) {
      state.selectedAssignedZoneId = null;
    }

    availEl.innerHTML = "";
    asgEl.innerHTML = "";

    if (!available.length) {
      const empty = document.createElement("div");
      empty.className = "vitem";
      empty.style.cursor = "default";
      empty.textContent = zones.length ? "No available zones" : "No zones";
      availEl.appendChild(empty);
    } else {
      for (const z of available) {
        const row = document.createElement("div");
        row.className = "vitem" + (state.selectedAvailZoneId === Number(z.id) ? " active" : "");
        row.dataset.id = String(z.id);
        row.textContent = zoneDisplay(z);
        availEl.appendChild(row);
      }
    }

    if (!assigned.length) {
      const empty = document.createElement("div");
      empty.className = "vitem";
      empty.style.cursor = "default";
      empty.textContent = "No assigned zones";
      asgEl.appendChild(empty);
    } else {
      for (const z of assigned) {
        const row = document.createElement("div");
        row.className = "vitem" + (state.selectedAssignedZoneId === Number(z.id) ? " active" : "");
        row.dataset.id = String(z.id);
        row.textContent = zoneDisplay(z);
        asgEl.appendChild(row);
      }
    }
  }

  function setUserActionsEnabled(enabled, isAdminUser = false) {
    const editIds = [
      "user-edit-username",
      "user-edit-password",
      "btn-user-save",
      "btn-user-delete",
      "btn-uz-add",
      "btn-uz-remove",
      "btn-uz-save",
    ];

    for (const id of editIds) {
      const el = $(id);
      if (!el) continue;
      el.disabled = !enabled || (isAdminUser && id !== "user-edit-password" ? true : false);
    }

    // allow admin password reset? backend currently blocks ALL admin modifications.
    // so keep everything disabled for admin.
    if (isAdminUser) {
      const pw = $("user-edit-password");
      if (pw) pw.disabled = true;
    }
  }

  function render() {
    if (!state.inited) return;

    renderUserList();

    const selected = state.selectedUserId ? findUser(state.selectedUserId) : null;
    const isAdmin = selected?.role === "admin";

    const badge = $("user-selected");
    if (badge) badge.textContent = selected?.username || "None";

    // Fill edit fields
    const editUsername = $("user-edit-username");
    if (editUsername) editUsername.value = selected?.username || "";

    // Role/label/tag are internal and not exposed in UI.

    const editPass = $("user-edit-password");
    if (editPass) editPass.value = "";

    // Enable/disable edit + assignment
    setUserActionsEnabled(!!selected, isAdmin);

    // Notes
    const noteEl = $("user-edit-note");
    if (!selected) setHint(noteEl, "Select a user from the list");
    else if (isAdmin) setHint(noteEl, "Admin user is protected and cannot be modified or assigned zones", true);
    else setHint(noteEl, "");

    // Assignment
    renderAssignmentLists();
  }

  async function reloadUsers(opts = {}) {
    const keepSelection = opts.keepSelection !== false;
    const [usersRes, zonesRes] = await Promise.all([
      api("/api/users"),
      api("/api/zones"),
    ]);

    state.users = usersRes.ok ? (usersRes.data?.users || []) : [];
    state.zones = zonesRes.ok ? (zonesRes.data?.zones || []) : [];

    if (!usersRes.ok) setStatus(usersRes.data?.message || "Failed loading users");
    if (!zonesRes.ok) setStatus(zonesRes.data?.message || "Failed loading zones");

    if (opts.selectUserId) state.selectedUserId = Number(opts.selectUserId) || null;

    if (keepSelection && state.selectedUserId) {
      const exists = state.users.some(u => u.id === state.selectedUserId);
      if (!exists) state.selectedUserId = null;
    }

    // If we have a selected user (non-admin), refresh assignments from server
    if (state.selectedUserId) {
      await loadAssignments(state.selectedUserId);
    } else {
      state.assignedZoneIds = [];
    }

    render();
  }

  async function loadAssignments(userId) {
    const u = findUser(userId);
    if (!u) {
      state.assignedZoneIds = [];
      return;
    }

    // Admin user: keep empty + disable
    if (u.role === "admin") {
      state.assignedZoneIds = [];
      return;
    }

    const r = await api(`/api/users/${userId}/zones`);
    if (!r.ok) {
      setHint($("uz-note"), r.data?.message || "Failed to load assignments", true);
      state.assignedZoneIds = [];
      return;
    }
    const zoneIds = r.data?.zoneIds || [];
    state.assignedZoneIds = zoneIds.map(Number).filter(n => Number.isInteger(n) && n > 0);
    setHint($("uz-note"), "");
  }

  function initOnce() {
    if (state.inited) return;

    const listEl = $("user-list");
    if (!listEl) return; // not on admin page

    state.inited = true;

    $("btn-user-reload")?.addEventListener("click", () => reloadUsers());
    $("user-search")?.addEventListener("input", () => renderUserList());

    // Select user
    listEl.addEventListener("click", async (e) => {
      const item = e.target?.closest?.(".vitem[data-id]");
      if (!item) return;
      const id = Number(item.dataset.id);
      if (!Number.isInteger(id)) return;

      state.selectedUserId = id;
      state.selectedAvailZoneId = null;
      state.selectedAssignedZoneId = null;

      await loadAssignments(id);
      render();
    });

    // Add user
    $("btn-user-add")?.addEventListener("click", async () => {
      const note = $("user-add-note");
      const username = String($("user-add-username")?.value || "").trim();
      const password = String($("user-add-password")?.value || "");

      if (!username) return setHint(note, "Username is required", true);
      if (!password) return setHint(note, "Password is required", true);

      setHint(note, "Adding...");
      // Role is internal and fixed to operator for all created users.
      const r = await api("/api/users", jsonOptions("POST", { username, password }));
      if (!r.ok) return setHint(note, r.data?.message || "Add failed", true);

      setHint(note, "User created");
      if ($("user-add-username")) $("user-add-username").value = "";
      if ($("user-add-password")) $("user-add-password").value = "";

      await reloadUsers({ keepSelection: false, selectUserId: r.data?.id || null });
    });

    // Save user
    $("btn-user-save")?.addEventListener("click", async () => {
      const uid = state.selectedUserId;
      if (!uid) return setStatus("Select a user first");

      const user = findUser(uid);
      if (!user) return setStatus("User not found");
      if (user.role === "admin") return setStatus("Admin user cannot be modified");

      const username = String($("user-edit-username")?.value || "").trim();
      const password = String($("user-edit-password")?.value || "");

      if (!username) return setStatus("Username is required");

      const patch = { username };
      if (password) patch.password = password;

      setHint($("user-edit-note"), "Saving...");
      const r = await api(`/api/users/${uid}`, jsonOptions("PUT", patch));
      if (!r.ok) return setHint($("user-edit-note"), r.data?.message || "Save failed", true);

      setHint($("user-edit-note"), "Saved");
      await reloadUsers({ keepSelection: true, selectUserId: uid });
    });

    // Delete user
    $("btn-user-delete")?.addEventListener("click", async () => {
      const uid = state.selectedUserId;
      if (!uid) return setStatus("Select a user first");

      const user = findUser(uid);
      if (!user) return setStatus("User not found");
      if (user.role === "admin") return setStatus("Admin user cannot be deleted");

      const ok = window.confirm(`Delete user "${user.username}"?`);
      if (!ok) return;

      setHint($("user-edit-note"), "Deleting...");
      const r = await api(`/api/users/${uid}`, { method: "DELETE" });
      if (!r.ok) return setHint($("user-edit-note"), r.data?.message || "Delete failed", true);

      setHint($("user-edit-note"), "Deleted");
      state.selectedUserId = null;
      state.assignedZoneIds = [];
      await reloadUsers({ keepSelection: false });
    });

    // Assignment list selection
    $("uz-available")?.addEventListener("click", (e) => {
      const item = e.target?.closest?.(".vitem[data-id]");
      if (!item) return;
      const id = toInt(item.dataset.id);
      if (!Number.isInteger(id) || id <= 0) return;
      state.selectedAvailZoneId = id;
      state.selectedAssignedZoneId = null;
      renderAssignmentLists();
    });

    $("uz-assigned")?.addEventListener("click", (e) => {
      const item = e.target?.closest?.(".vitem[data-id]");
      if (!item) return;
      const id = toInt(item.dataset.id);
      if (!Number.isInteger(id) || id <= 0) return;
      state.selectedAssignedZoneId = id;
      state.selectedAvailZoneId = null;
      renderAssignmentLists();
    });

    // Move to assigned
    $("btn-uz-add")?.addEventListener("click", () => {
      const uid = state.selectedUserId;
      const user = uid ? findUser(uid) : null;
      if (!user) return setHint($("uz-note"), "Select a user", true);
      if (user.role === "admin") return setHint($("uz-note"), "Admin zones are not managed here", true);
      if (!state.selectedAvailZoneId) return;

      const id = state.selectedAvailZoneId;
      if (!state.assignedZoneIds.includes(id)) state.assignedZoneIds.push(id);
      state.selectedAvailZoneId = null;
      renderAssignmentLists();
    });

    // Move back to available
    $("btn-uz-remove")?.addEventListener("click", () => {
      const uid = state.selectedUserId;
      const user = uid ? findUser(uid) : null;
      if (!user) return setHint($("uz-note"), "Select a user", true);
      if (user.role === "admin") return setHint($("uz-note"), "Admin zones are not managed here", true);
      if (!state.selectedAssignedZoneId) return;

      const id = state.selectedAssignedZoneId;
      state.assignedZoneIds = (state.assignedZoneIds || []).filter(x => Number(x) !== Number(id));
      state.selectedAssignedZoneId = null;
      renderAssignmentLists();
    });

    // Save assignment
    $("btn-uz-save")?.addEventListener("click", async () => {
      const uid = state.selectedUserId;
      const user = uid ? findUser(uid) : null;
      if (!user) return setHint($("uz-note"), "Select a user", true);
      if (user.role === "admin") return setHint($("uz-note"), "Admin zones are not managed here", true);

      const zoneIds = (state.assignedZoneIds || []).map(Number).filter(n => Number.isInteger(n) && n > 0);
      setHint($("uz-note"), "Saving...");
      const r = await api(`/api/users/${uid}/zones`, jsonOptions("PUT", { zoneIds }));
      if (!r.ok) return setHint($("uz-note"), r.data?.message || "Save failed", true);

      setHint($("uz-note"), "Saved");
      await loadAssignments(uid);
      renderAssignmentLists();
    });
  }

  return {
    onShow() {
      initOnce();
      reloadUsers();
      setStatus("Users: loaded");
    }
  };
}
