document.getElementById("btn-up").onclick = () => send("up");
document.getElementById("btn-down").onclick = () => send("down");
document.getElementById("btn-left").onclick = () => send("left");
document.getElementById("btn-right").onclick = () => send("right");

// ---- PCAP upload ----
const uploadBtn = document.getElementById("btn-upload");
const fileInput = document.getElementById("pcap-input");
const statusEl = document.getElementById("status");

uploadBtn.onclick = () => fileInput.click();

fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    const name = document.getElementById("device-name").value.trim();
    if (!file) return;
    if (!name) {
        statusEl.textContent = "Please enter a device name.";
        return;
    }
    const formData = new FormData();
    formData.append("pcap", file);
    formData.append("name", name);


    try {
        statusEl.textContent = "Uploading PCAP...";

        const res = await fetch("/api/upload-pcap", {
            method: "POST",
            body: formData,
        });

        // Read JSON even on non-200
        let data = null;
        try { data = await res.json(); } catch (_) { }

        if (!res.ok) {
            statusEl.textContent = data?.message || `Upload failed (HTTP ${res.status})`;
            return;
        }

        statusEl.textContent = data?.message || "PCAP uploaded.";
    } catch (err) {
        statusEl.textContent = "Error uploading PCAP: " + err.message;
    } finally {
        fileInput.value = "";
    }
};

async function send(cmd) {
    const status = document.getElementById("status");
    try {
        status.textContent = `Sending ${cmd}...`;
        const res = await fetch(`/api/${cmd}`, { method: "POST" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        status.textContent = `Sent ${cmd}.`;
    } catch (e) {
        status.textContent = `Error sending ${cmd}: ${e.message}`;
    }
}