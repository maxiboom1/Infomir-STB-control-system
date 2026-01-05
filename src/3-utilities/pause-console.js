// src/3-utilities/pause-console.js
// Utility to keep the Windows console open on fatal startup/runtime errors
// when running as a packaged EXE (pkg). This avoids the "flash and close"
// behavior when double-clicking the EXE.

import { spawnSync } from "child_process";

function shouldPause() {
  // Only pause by default when running as pkg EXE.
  // You can force it in dev using: MAG_PAUSE_ON_EXIT=1
  return Boolean(process?.pkg) || process.env.MAG_PAUSE_ON_EXIT === "1";
}

export function pauseConsoleIfNeeded(message) {
  if (!shouldPause()) return;

  // Best UX for Windows users: use native cmd pause.
  if (process.platform === "win32") {
    try {
      if (message) console.log(message);
      spawnSync("cmd.exe", ["/c", "pause"], { stdio: "inherit" });
      return;
    } catch {
      // fall through
    }
  }
}

export function pauseThenExitIfNeeded(exitCode = 1, message) {
  pauseConsoleIfNeeded(message);
  process.exit(exitCode);
}
