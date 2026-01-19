/**
 * channels-tab.js — Admin Channels map (v1.2.0)
 *
 * - Admin can set friendly names for channels 1..64.
 * - Operator UI renders only named channels.
 */

export function initChannelsTab(shared) {
  const { $, api, setHint, jsonOptions } = shared;

  const elSearch = $("ch-search");
  const elList = $("ch-list");
  const btnSave = $("btn-ch-save");
  const btnReload = $("btn-ch-reload");
  const elNote = $("ch-note");

  const TOTAL = 64;

  // Map: channelNumber -> name (server snapshot)
  let baseline = new Map();
  // Array of { channelNumber, name } (editable)
  let current = [];

  const normalize = (name) => String(name ?? "").trim().substring(0, 64);

  function matchesFilter(item, q) {
    if (!q) return true;
    const s = String(q).toLowerCase();
    return String(item.channelNumber).includes(s) || String(item.name || "").toLowerCase().includes(s);
  }

  function render() {
    if (!elList) return;
    const q = String(elSearch?.value || "").trim();
    const items = current.filter(it => matchesFilter(it, q));

    elList.innerHTML = items.map((it) => {
      const num = it.channelNumber;
      const name = it.name || "";
      return `
        <div class="vitem ch-row" data-num="${num}">
          <div class="ch-left">
            <div class="badge">${num}</div>
          </div>
          <div class="ch-right">
            <input class="input ch-input" data-num="${num}" type="text" maxlength="64" placeholder="(empty)" value="${escapeAttr(name)}" />
          </div>
        </div>
      `;
    }).join("");
  }

  function escapeAttr(s) {
    return String(s || "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[c]);
  }

  async function load() {
    setHint(elNote, "Loading…");
    const res = await api("/api/channels-map");
    if (!res.ok) {
      setHint(elNote, res.data?.message || "Failed to load channels map", true);
      return;
    }

    baseline = new Map();
    const incoming = Array.isArray(res.data?.channels) ? res.data.channels : [];
    for (const row of incoming) {
      const n = Number(row?.channelNumber);
      if (!Number.isInteger(n) || n < 1 || n > TOTAL) continue;
      baseline.set(n, normalize(row?.name));
    }

    current = Array.from({ length: TOTAL }, (_, i) => {
      const n = i + 1;
      return { channelNumber: n, name: baseline.get(n) || "" };
    });

    render();
    setHint(elNote, "Ready");
  }

  async function save() {
    if (!elList) return;
    const inputs = Array.from(elList.querySelectorAll("input.ch-input"));
    const updates = [];

    for (const inp of inputs) {
      const n = Number(inp.dataset.num);
      if (!Number.isInteger(n) || n < 1 || n > TOTAL) continue;
      const name = normalize(inp.value);
      const prev = baseline.get(n) || "";
      if (name !== prev) updates.push({ channelNumber: n, name });
    }

    if (!updates.length) {
      setHint(elNote, "No changes to save");
      return;
    }

    setHint(elNote, `Saving ${updates.length} changes…`);
    const res = await api("/api/channels-map", jsonOptions("PUT", { channels: updates }));
    if (!res.ok) {
      setHint(elNote, res.data?.message || "Save failed", true);
      return;
    }

    setHint(elNote, res.data?.message || "Saved");
    await load();
  }

  // Events
  elSearch?.addEventListener("input", () => render());
  btnReload?.addEventListener("click", () => load());
  btnSave?.addEventListener("click", () => save());

  // Mark dirty on edit (visual only)
  elList?.addEventListener("input", (e) => {
    const inp = e.target?.closest?.("input.ch-input");
    if (!inp) return;
    const n = Number(inp.dataset.num);
    const now = normalize(inp.value);
    const prev = baseline.get(n) || "";
    inp.classList.toggle("dirty", now !== prev);
  });

  return {
    onShow() {
      // Lazy-load
      if (!baseline.size) load();
    }
  };
}
