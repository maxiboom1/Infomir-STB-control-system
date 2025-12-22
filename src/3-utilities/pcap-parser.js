import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const PcapParser = require("pcap-parser");

/**
 * Parse a PCAP file and extract MAG STB connection params.
 * Returns an object that matches SQL "device" table column names: ip, port, blob
 *
 * @param {string} filePath
 * @param {{ signature?: string }} [options]
 * @returns {Promise<{ ip: string, port: number, blob: string }>}
 */
export default function parsePcap(filePath, options = {}) {
    const signature = options.signature ?? "rc-code-req";
    const rcSig = Buffer.from(signature, "ascii");

    return new Promise((resolve, reject) => {
        let resolved = false;
        let packetCount = 0;

        const stream = fs.createReadStream(filePath);
        const parser = PcapParser.parse(stream);

        const cleanup = () => {
            parser.removeAllListeners();
            stream.removeAllListeners();
            // stop reading further packets once we found what we need
            if (!stream.destroyed) stream.destroy();
        };

        const fail = (err) => {
            if (resolved) return;
            resolved = true;
            cleanup();
            reject(err);
        };

        parser.on("packet", (packet) => {
            if (resolved) return;

            packetCount++;
            const buf = packet?.data;
            if (!Buffer.isBuffer(buf) || buf.length < 20) return;

            // Find IPv4 header offset:
            // - sometimes packet.data starts at IPv4
            // - often it's Ethernet (14 bytes) then IPv4
            // - sometimes Ethernet + VLAN (18 bytes) then IPv4
            let ipOffset = -1;
            if ((buf[0] >> 4) === 4) ipOffset = 0;
            else if (buf.length >= 14 + 20 && (buf[14] >> 4) === 4) ipOffset = 14;
            else if (buf.length >= 18 + 20 && (buf[18] >> 4) === 4) ipOffset = 18;
            else return;

            const version = buf[ipOffset] >> 4;
            if (version !== 4) return;

            const ihl = (buf[ipOffset] & 0x0f) * 4;
            if (ihl < 20) return;

            const protocol = buf[ipOffset + 9];
            if (protocol !== 6) return; // TCP only

            if (buf.length < ipOffset + ihl + 20) return;

            const ipDstOffset = ipOffset + 16;
            const ip = `${buf[ipDstOffset]}.${buf[ipDstOffset + 1]}.${buf[ipDstOffset + 2]}.${buf[ipDstOffset + 3]}`;

            // TCP header starts right after IP header
            const tcpOffset = ipOffset + ihl;

            const port = buf.readUInt16BE(tcpOffset + 2); // dst port
            const tcpHeaderLen = ((buf[tcpOffset + 12] >> 4) & 0x0f) * 4;
            if (tcpHeaderLen < 20) return;

            const payloadOffset = tcpOffset + tcpHeaderLen;
            if (payloadOffset > buf.length) return;

            const payload = buf.slice(payloadOffset);
            if (payload.length === 0) return;

            // Filter only packets that contain rc-code-req
            if (!payload.includes(rcSig)) return;

            const payloadHex = payload.toString("hex");

            // remove last 3 bytes (6 hex chars) as the rc part
            const blob = payloadHex.length >= 6 ? payloadHex.slice(0, -6) : payloadHex;

            resolved = true;
            cleanup();
            resolve({ ip, port, blob });
        });

        parser.on("end", () => {
            if (resolved) return;
            fail(
                new Error(
                    `PCAP parsed (${packetCount} packets) but no "${signature}" payload was found.`
                )
            );
        });

        parser.on("error", (err) => fail(err));
        stream.on("error", (err) => fail(err));
    });
}
