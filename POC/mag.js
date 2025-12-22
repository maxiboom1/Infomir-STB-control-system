// server.js
const express = require("express");
const net = require("net");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const PcapParser = require("pcap-parser");

const app = express();
const PORT = 3000;

// ===== MAG CONFIG (pairing-specific) =====
const MAG_IP = "192.168.0.119";
const MAG_PORT = 40611;

const actions = {
  UP: "1acbc3",
  DOWN: "1bc2c3",
  LEFT: "1bc3c3",
  RIGHT: "15c3c3",
};

const stbObj = {
  office_original:
    "00000001700072632d636f64652d72657172632d636f64652d72657172632d636f64652d7265" +
    "0fbb1f99e64d1f819128ea8487e5b61c8dee8426754bf84c18ab64600025cc60b898894f53de" +
    "10dd7d70f1c7956160867eeceb325c3fe5813939dc11c3eb7b26268c9f5a2371b3",
  office: 
    "00000001700072632d636f64652d72657172632d636f64652d72657172632d636f64652d7265" +
    "b6d2fa49ced683f3f4aebbae1f90369f098b6d678f90a29b83163d8b816a9784e07f46a928c3" + 
    "71d1f3af2e55fb39e0902291756b394261d438c70303401c1fa2ea4f59b11b7d46"
};



// connect-req payload (TCP payload only)
const connectReqHex =
  "000000016200636f6e6e6563742d726571636f6e6e6563742d726571636f6e6e6563742d72657b226465765f6964223a2265353233303965386438386535323034222c226465765f6465736372223a2273616d73756e6720534d2d4133333645227d";

const connectReq = Buffer.from(connectReqHex, "hex");

// ===== MAG TCP CLIENT =====
let magSocket = null;
let isConnected = false;
let reconnectTimer = null;

function connectToMag() {
  if (magSocket && !magSocket.destroyed) return;

  console.log(`Connecting to MAG ${MAG_IP}:${MAG_PORT}...`);

  magSocket = net.createConnection(
    { host: MAG_IP, port: MAG_PORT },
    () => {
      console.log("MAG TCP connected, sending connect-req...");
      isConnected = true;
      magSocket.write(connectReq);
    }
  );

  magSocket.setNoDelay(true);

  magSocket.on("data", (data) => {
    console.log("MAG >", data.toString("hex"));
  });

  magSocket.on("error", (err) => {
    console.error("MAG socket error:", err.message);
    isConnected = false;
    scheduleReconnect();
  });

  magSocket.on("close", () => {
    console.log("MAG TCP connection closed");
    isConnected = false;
    scheduleReconnect();
  });
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectToMag();
  }, 2000);
}

function sendCommand(buf, name) {
  if (!buf) {
    console.warn(`Command ${name} not configured`);
    return;
  }
  if (!isConnected || !magSocket || magSocket.destroyed) {
    console.warn(`Not connected to MAG, cannot send ${name}`);
    return;
  }
  console.log(`Sending ${name} command...`);
  magSocket.write(buf);
}

// ===== COMMAND BUILDER (per STB) =====
function buildCommand(stbKey, action) {
  const base = stbObj[stbKey];
  const suffix = actions[action];
  if (!base || !suffix) return null;
  return Buffer.from(base + suffix, "hex");
}

// ===== STATIC FILES =====
app.use(express.static(path.join(__dirname, "public")));

// ===== PCAP UPLOAD + PARSE =====
const upload = multer({ dest: path.join(__dirname, "uploads") });


function parsePcap(filePath) {
  console.log("Parsing PCAP:", filePath);

  const stream = fs.createReadStream(filePath);
  const parser = PcapParser.parse(stream);

  let count = 0;
  let found = false;
  const rcSig = Buffer.from("rc-code-req", "ascii");

  parser.on("packet", (packet) => {
    if (found) return; // we only care about the first rc-code packet

    count++;
    const { header, data } = packet;

    const tsSec = header.timestampSeconds ?? header.tv_sec ?? 0;
    const tsUsec =
      header.timestampMicroseconds ?? header.tv_usec ?? 0;

    const buf = data; // raw IPv4

    if (buf.length < 20) return; // too short

    // ---- IPv4 ----
    const version = buf[0] >> 4;
    if (version !== 4) return;

    const ihl = (buf[0] & 0x0f) * 4;
    const protocol = buf[9];
    if (protocol !== 6) return; // not TCP

    const srcIp = `${buf[12]}.${buf[13]}.${buf[14]}.${buf[15]}`;
    const dstIp = `${buf[16]}.${buf[17]}.${buf[18]}.${buf[19]}`;

    // ---- TCP ----
    if (buf.length < ihl + 20) return;

    const tcpOffset = ihl;
    const srcPort = buf.readUInt16BE(tcpOffset);
    const dstPort = buf.readUInt16BE(tcpOffset + 2);
    const tcpHeaderLen = ((buf[tcpOffset + 12] >> 4) & 0x0f) * 4;
    const payloadOffset = tcpOffset + tcpHeaderLen;
    if (payloadOffset > buf.length) return;

    const payload = buf.slice(payloadOffset);
    if (payload.length === 0) return;

    // ---- filter only rc-code-req packets ----
    if (!payload.includes(rcSig)) return;

    const payloadHex = payload.toString("hex");

    // remove last 3 bytes (6 hex chars) as the rc part
    let baseHex = payloadHex;
    if (baseHex.length >= 6) {
      baseHex = baseHex.slice(0, -6);
    }

    console.log("=== RC-CODE PACKET (PARSED) ===");
    console.log(`ts=${tsSec}.${tsUsec}`);
    console.log(`  STB IP   : ${dstIp}`);
    console.log(`  STB PORT : ${dstPort}`);
    console.log(`  BASE BLOB: ${baseHex}`);
    console.log("================================");

    // here in future we can save these into config / DB
    found = true;
  });

  parser.on("end", () => {
    console.log(`Finished parsing PCAP. Total packets: ${count}`);
    if (!found) {
      console.log("No rc-code-req packet found in this capture.");
    }
  });

  parser.on("error", (err) => {
    console.error("PCAP parse error:", err);
  });
}


app.post("/api/upload-pcap", upload.single("pcap"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, message: "No file uploaded" });
  }

  console.log("Received PCAP upload:", req.file.path);
  parsePcap(req.file.path);

  res.json({
    ok: true,
    message: "PCAP uploaded; parsing on server (see console).",
  });
});

// ===== API ROUTES FOR REMOTE BUTTONS =====
app.post("/api/up", (req, res) => {
  const cmd = buildCommand("office", "UP");
  sendCommand(cmd, "UP");
  res.json({ ok: true });
});

app.post("/api/down", (req, res) => {
  const cmd = buildCommand("office", "DOWN");
  sendCommand(cmd, "DOWN");
  res.json({ ok: true });
});

app.post("/api/left", (req, res) => {
  const cmd = buildCommand("office", "LEFT");
  sendCommand(cmd, "LEFT");
  res.json({ ok: true });
});

app.post("/api/right", (req, res) => {
  const cmd = buildCommand("office", "RIGHT");
  sendCommand(cmd, "RIGHT");
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`HTTP server on http://localhost:${PORT}`);
  connectToMag();
});
