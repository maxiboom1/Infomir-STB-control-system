/**
 * admin.js — Admin UI behavior
 * v0.7.1: UI skeleton only (no CRUD wiring yet for tabs).
 * Next milestone: wire Devices tab (list + add/edit/delete + zone reassignment),
 * then wire Categories/Zones + Users.
 */

const statusEl = document.getElementById("status");
function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
}

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
}

tabButtons.forEach(btn => btn.addEventListener("click", () => setTab(btn.dataset.tab)));

const defaultTab = localStorage.getItem("adminTab") || "devices";
setTab(defaultTab);

/* =========================
   Skeleton notes
   =========================
   This file intentionally does NOT implement CRUD wiring yet.
   All wiring will be done with guarded DOM access per-tab,
   using the existing backend CRUD routes (routes → service → sql).
 */
