const form = document.getElementById("login-form");
const btn = document.getElementById("btn-login");
const statusEl = document.getElementById("status");

function setStatus(msg) {
  statusEl.textContent = msg;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    setStatus("Please enter username and password.");
    return;
  }

  btn.disabled = true;
  setStatus("Logging in...");

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // cookie-based JWT later
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setStatus(data?.message || "Login failed.");
      btn.disabled = false;
      return;
    }
    console.log(res)
    setStatus("Success. Redirecting...");
    window.location.href = "/"; // server will serve admin/user after auth (next step)
  } catch (err) {
    setStatus("Network error.");
    btn.disabled = false;
  }
});
