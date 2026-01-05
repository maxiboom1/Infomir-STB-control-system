import path from "path";
import { fileURLToPath } from "url";

// Resolve paths safely for both:
//  - dev (node): project root
//  - packaged (pkg): exe folder (external) + snapshot (internal)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This file lives in: <root>/src/3-utilities
const INTERNAL_ROOT = path.resolve(__dirname, "..", "..", "..");

// External root (where config/logs live)
// - dev: project root
// - pkg: folder containing the exe
const EXTERNAL_ROOT = process.pkg
  ? path.dirname(process.execPath)
  : INTERNAL_ROOT;

export function isPackaged() {
  return Boolean(process.pkg);
}

export function getInternalPath(...parts) {
  return path.join(INTERNAL_ROOT, ...parts);
}

export function getExternalPath(...parts) {
  return path.join(EXTERNAL_ROOT, ...parts);
}

export function getInternalRoot() {
  return INTERNAL_ROOT;
}

export function getExternalRoot() {
  return EXTERNAL_ROOT;
}
