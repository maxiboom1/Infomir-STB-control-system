const form = document.getElementById("pw-form");
const btn = document.getElementById("pw-submit");
const statusEl = document.getElementById("pw-status");

function setStatus(msg, isError = false) {
  statusEl.textContent = msg || "";
  statusEl.style.color = isError ? "#ff8a8a" : "";
}

async function api(url, options = {}) {
  const res = await fetch(url, { credentials: "include", ...options });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function validate(pw, confirm) {
  const p = String(pw || "");
  if (p.length < 8) return "Password must be at least 8 characters";
  if (p === "admin") return "Password cannot be 'admin'";
  if (p.includes("\\")) return "Password cannot contain \\";
  if (p !== String(confirm || "")) return "Passwords do not match";
  return "";
}

// Gate this page
(async () => {
  const me = await api("/api/auth/me");
  if (!me.ok) {
    window.location.href = "/login.html";
    return;
  }
  if (me.data?.user?.role !== "admin") {
    window.location.href = "/";
    return;
  }
})();

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const pw = document.getElementById("pw-new").value;
  const confirm = document.getElementById("pw-confirm").value;
  const err = validate(pw, confirm);
  if (err) {
    setStatus(err, true);
    return;
  }

  btn.disabled = true;
  setStatus("Updating password...");

  try {
    const res = await api("/api/auth/change-admin-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: pw })
    });

    if (!res.ok) {
      setStatus(res.data?.message || "Failed to update password", true);
      btn.disabled = false;
      return;
    }

    setStatus("Password updated. Please log in again.");
    setTimeout(() => {
      window.location.href = "/login.html";
    }, 600);
  } catch {
    setStatus("Network error", true);
    btn.disabled = false;
  }
});
