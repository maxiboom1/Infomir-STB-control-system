/**
 * admin.js — Admin UI entry (ES module)
 * v0.7.7: ES modules + Devices tab wired
 *
 * Rules:
 * - This file handles ONLY: shared helpers, logout, left-nav routing, and lazy tab init.
 * - Each tab has its own module under /assets/tabs/*
 */

import { initCatZonesTab } from "./tabs/catzones-tab.js";
import { initDevicesTab } from "./tabs/devices-tab.js";
import { initUsersTab } from "./tabs/users-tab.js";
import { initChannelsTab } from "./tabs/channels-tab.js";
import { initBackupTab } from "./tabs/backup-tab.js";

/* =========================
   Shared helpers
   ========================= */

function $(id) {
  return document.getElementById(id);
}

const statusEl = $("status");
function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
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

async function api(url, options = {}) {
  const res = await fetch(url, { credentials: "include", ...options });
  const data = await res.json().catch(() => ({}));

  // If admin is locked (default password), force password change flow.
  if (res.status === 423 || data?.forcePasswordChange) {
    if (!window.location.pathname.endsWith("/force-password.html")) {
      window.location.href = "/force-password.html";
    }
    return { ok: false, status: res.status, data };
  }

  // If auth expired, return user to login page.
  if (res.status === 401 || res.status === 403) {
    if (!window.location.pathname.endsWith("/login.html")) {
      window.location.href = "/login.html";
    }
  }

  return { ok: res.ok, status: res.status, data };
}

const shared = Object.freeze({
  $, api, setStatus, setHint, toInt, jsonOptions,
});

/* =========================
   Logout
   ========================= */

$("btn-logout")?.addEventListener("click", async () => {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } finally {
    window.location.href = "/login.html";
  }
});

/* =========================
   Tabs: left-nav routing
   ========================= */

const tabButtons = Array.from(document.querySelectorAll(".nav-tab[data-tab]"));
const panels = Array.from(document.querySelectorAll(".tab-panel[data-panel]"));

const controllers = {
  devices: null,
  catzones: null,
  channels: null,
  users: null,
  backup: null,
};

function ensureController(tabName) {
  if (controllers[tabName]) return controllers[tabName];

  if (tabName === "devices") controllers.devices = initDevicesTab(shared);
  else if (tabName === "catzones") controllers.catzones = initCatZonesTab(shared);
  else if (tabName === "channels") controllers.channels = initChannelsTab(shared);
  else if (tabName === "users") controllers.users = initUsersTab(shared);
  else if (tabName === "backup") controllers.backup = initBackupTab(shared);

  return controllers[tabName];
}

function setTab(tabName) {
  // Close all accordion panes when switching tabs
  closeAllAccordions();
  tabButtons.forEach(btn => {
    const isActive = btn.dataset.tab === tabName;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });

  panels.forEach(p => {
    const show = p.dataset.panel === tabName;
    p.style.display = show ? "" : "none";
  });

  setStatus(`Tab: ${tabName}`);

  const ctrl = ensureController(tabName);
  ctrl?.onShow?.();
}

tabButtons.forEach(btn => btn.addEventListener("click", () => setTab(btn.dataset.tab)));

document.addEventListener("DOMContentLoaded", () => {
  initAccordionBehavior();
  (async () => {
    // Gate admin UI if default password is still in place
    const me = await api("/api/auth/me");
    if (!me.ok) return; // api() already redirected
    if (me.data?.user?.role !== "admin") {
      window.location.href = "/";
      return;
    }
    if (me.data?.forcePasswordChange) {
      window.location.href = "/force-password.html";
      return;
    }
    setTab("catzones");
  })();
});


/* =========================
   Accordion behavior (Admin)
   ========================= */

function closeAllAccordions() {
  document.querySelectorAll('details.section.acc').forEach(d => { d.open = false; });
}

function initAccordionBehavior() {
  // Enforce "single-open" accordion across the entire admin page.
  // Use capture=true because <details> toggle doesn't reliably bubble.
  document.addEventListener('toggle', (e) => {
    const d = e.target;
    if (!(d instanceof HTMLDetailsElement)) return;
    if (!d.matches('details.section.acc')) return;
    if (!d.open) return;

    document.querySelectorAll('details.section.acc').forEach(other => {
      if (other !== d) other.open = false;
    });
  }, true);
}
