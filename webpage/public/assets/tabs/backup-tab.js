/**
 * backup-tab.js — Admin Backup/Restore (v1.3.1)
 *
 * Export: downloads a full DB snapshot JSON.
 * Import: uploads snapshot JSON to server (overwrites DB).
 * Option: keep current admin credentials.
 */

export function initBackupTab(shared) {
  const { $, api, jsonOptions, setHint } = shared;

  const btnExport = $("btn-db-export");
  const btnImport = $("btn-db-import");
  const elExportNote = $("db-export-note");
  const elImportNote = $("db-import-note");
  const elSummary = $("db-import-summary");
  const elFile = $("db-import-file");
  const elKeepAdmin = $("db-keep-admin");

  let parsedSnapshot = null;

  function summarize(snap) {
    const c = Array.isArray(snap?.categories) ? snap.categories.length : 0;
    const z = Array.isArray(snap?.zones) ? snap.zones.length : 0;
    const d = Array.isArray(snap?.devices) ? snap.devices.length : 0;
    const ch = Array.isArray(snap?.channels_map) ? snap.channels_map.length : 0;
    const u = Array.isArray(snap?.users) ? snap.users.length : 0;
    const uz = Array.isArray(snap?.user_zones) ? snap.user_zones.length : 0;

    const lines = [];
    if (snap?.exportVersion) lines.push(`Export version: ${snap.exportVersion}`);
    if (snap?.exportedAt) lines.push(`Exported at: ${snap.exportedAt}`);
    lines.push(`Categories: ${c}`);
    lines.push(`Zones: ${z}`);
    lines.push(`Devices: ${d}`);
    lines.push(`Channels map rows: ${ch}`);
    lines.push(`Users: ${u}`);
    lines.push(`User-zone assignments: ${uz}`);
    return lines.join("\n");
  }

  async function exportSnapshot() {
    setHint(elExportNote, "Exporting…");
    try {
      const res = await fetch("/api/db-export", { credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setHint(elExportNote, data?.message || `Export failed (${res.status})`, true);
        return;
      }

      const blob = await res.blob();
      const cd = res.headers.get("content-disposition") || "";
      const m = cd.match(/filename\s*=\s*"?([^";]+)"?/i);
      const filename = (m && m[1]) ? m[1] : "mag_control_export.json";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setHint(elExportNote, `Downloaded ${filename}`);
    } catch (err) {
      setHint(elExportNote, String(err?.message || err || "Export failed"), true);
    }
  }

  async function importSnapshot() {
    if (!parsedSnapshot) {
      setHint(elImportNote, "Choose a snapshot file first", true);
      return;
    }

    const keepAdmin = !!elKeepAdmin?.checked;

    const warn =
      "IMPORT WILL OVERWRITE THE ENTIRE DATABASE\n\n" +
      "This will replace: users, user permissions (user_zones), categories, zones, devices, device positions, and channels map.\n\n" +
      (keepAdmin
        ? "Keep current admin credentials: YES (recommended)\n\n"
        : "Keep current admin credentials: NO\n\n") +
      "Continue?";

    const ok = window.confirm(warn);
    if (!ok) return;

    setHint(elImportNote, "Importing…");
    btnImport && (btnImport.disabled = true);

    const res = await api("/api/db-import", jsonOptions("POST", { snapshot: parsedSnapshot, keepAdmin }));

    btnImport && (btnImport.disabled = false);

    if (!res.ok) {
      setHint(elImportNote, res.data?.message || "Import failed", true);
      return;
    }

    setHint(elImportNote, res.data?.message || "Import completed. Please re-login.");

    // Force logout to avoid stale JWT uid mismatch after restore.
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // ignore
    }
    window.location.href = "/login.html";
  }

  async function readFile(file) {
    setHint(elImportNote, "");
    parsedSnapshot = null;
    if (!elSummary) return;

    if (!file) {
      elSummary.textContent = "";
      return;
    }

    try {
      const text = await file.text();
      const obj = JSON.parse(text);
      parsedSnapshot = obj;
      elSummary.textContent = summarize(obj);
      setHint(elImportNote, "Snapshot loaded");
    } catch (err) {
      parsedSnapshot = null;
      elSummary.textContent = "";
      setHint(elImportNote, "Invalid JSON snapshot file", true);
    }
  }

  // Wire events once
  btnExport?.addEventListener("click", () => exportSnapshot());
  btnImport?.addEventListener("click", () => importSnapshot());
  elFile?.addEventListener("change", (e) => readFile(e.target?.files?.[0] || null));

  return {
    onShow() {
      // no-op for now
    }
  };
}
