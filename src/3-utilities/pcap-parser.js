import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const PcapParser = require("pcap-parser");

/**
 * Parse PCAP and return { ip, port, blob, keymap }
 * - blob = rc-code-req payload without last 3 bytes
 * - keymap = { KEY_NAME: "xxxxxx" } where value is last 3 bytes (6 hex chars)
 */
export default function parsePcap(filePath, options = {}) {
  const keysSequence =
    options.keysSequence ??
    [
      "1","2","3","4","5","6","7","8","9","0",
      "CH_PLUS","CH_MINUS",
      "UP","RIGHT","DOWN","LEFT",
      "OK","RETURN","HOME","MENU"
    ];

  const rcSig = Buffer.from("rc-code-req", "ascii");

  return new Promise((resolve, reject) => {
    let packetCount = 0;

    let foundIp = null;
    let foundPort = null;

    let baseBlob = null;
    const suffixes = [];

    const stream = fs.createReadStream(filePath);
    const parser = PcapParser.parse(stream);

    const cleanup = () => {
      parser.removeAllListeners();
      stream.removeAllListeners();
      if (!stream.destroyed) stream.destroy();
    };

    const fail = (err) => {
      cleanup();
      reject(err);
    };

    parser.on("packet", (packet) => {
      packetCount++;
      const buf = packet?.data;
      if (!Buffer.isBuffer(buf) || buf.length < 20) return;

      // Find IPv4 header offset
      let ipOffset = -1;
      if ((buf[0] >> 4) === 4) ipOffset = 0;
      else if (buf.length >= 14 + 20 && (buf[14] >> 4) === 4) ipOffset = 14;
      else if (buf.length >= 18 + 20 && (buf[18] >> 4) === 4) ipOffset = 18;
      else return;

      const ihl = (buf[ipOffset] & 0x0f) * 4;
      if (ihl < 20) return;

      const protocol = buf[ipOffset + 9];
      if (protocol !== 6) return; // TCP only

      const tcpOffset = ipOffset + ihl;
      if (buf.length < tcpOffset + 20) return;

      const dstPort = buf.readUInt16BE(tcpOffset + 2);
      const tcpHeaderLen = ((buf[tcpOffset + 12] >> 4) & 0x0f) * 4;
      if (tcpHeaderLen < 20) return;

      const payloadOffset = tcpOffset + tcpHeaderLen;
      if (payloadOffset > buf.length) return;

      const payload = buf.slice(payloadOffset);
      if (!payload.length) return;

      // Only rc-code-req (this automatically ignores ping-req / ping-resp)
      if (!payload.includes(rcSig)) return;

      // dst IP (STB)
      const ipDstOffset = ipOffset + 16;
      const ip = `${buf[ipDstOffset]}.${buf[ipDstOffset + 1]}.${buf[ipDstOffset + 2]}.${buf[ipDstOffset + 3]}`;

      if (!foundIp) foundIp = ip;
      if (!foundPort) foundPort = dstPort;

      const payloadHex = payload.toString("hex");
      if (payloadHex.length < 6) return;

      const suffix = payloadHex.slice(-6);
      const blob = payloadHex.slice(0, -6);

      if (!baseBlob) baseBlob = blob;

      // avoid duplicates if same packet appears twice
      if (suffixes[suffixes.length - 1] === suffix) return;

      suffixes.push(suffix);

      if (suffixes.length === keysSequence.length) {
        const keymap = {};
        for (let i = 0; i < keysSequence.length; i++) {
          keymap[keysSequence[i]] = suffixes[i];
        }

        cleanup();
        return resolve({
          ip: foundIp,
          port: foundPort,
          blob: baseBlob,
          keymap,
        });
      }
    });

    parser.on("end", () => {
      const missing = keysSequence.length - suffixes.length;
      fail(new Error(`PCAP ended. Collected ${suffixes.length}/${keysSequence.length} keys. Missing ${missing}.`));
    });

    parser.on("error", fail);
    stream.on("error", fail);
  });
}