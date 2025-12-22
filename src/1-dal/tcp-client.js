// 1-dal/tcp-client.js
import net from "node:net";

/**
 * Fire-and-forget:
 * connect -> send connectReqHex -> send payloadHex -> close -> resolve
 *
 * @param {string} ip
 * @param {number} port
 * @param {string} connectReqHex
 * @param {string} payloadHex
 * @param {number} [connectTimeoutMs=1500]
 * @returns {Promise<{ ok: true }>}
 */
export function magSendOnce(ip, port, connectReqHex, payloadHex, connectTimeoutMs = 1500) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();

    const connectBuf = Buffer.from(String(connectReqHex || "").trim(), "hex");
    if (!connectBuf.length) return reject(new Error("connectReqHex is empty/invalid"));

    const payloadBuf = Buffer.from(String(payloadHex || "").trim(), "hex");
    if (!payloadBuf.length) return reject(new Error("payloadHex is empty/invalid"));

    const cleanup = () => {
      socket.removeAllListeners();
      try { socket.end(); } catch (_) {}
      try { socket.destroy(); } catch (_) {}
    };

    const t = setTimeout(() => {
      cleanup();
      reject(new Error(`Connect timeout to ${ip}:${port}`));
    }, connectTimeoutMs);

    socket.on("error", (e) => {
      clearTimeout(t);
      cleanup();
      reject(e);
    });

    socket.connect(port, ip, () => {
      clearTimeout(t);

      // Send connect-req, then the command payload
      socket.write(connectBuf);
      socket.write(payloadBuf);

      // Close immediately
      socket.end();

      resolve({ ok: true });
    });
  });
}
