import path from "path";
import { fileURLToPath } from "url";

// Resolve paths safely for both:
//  - dev (node): external root = process.cwd() (where you start the app)
//  - packaged (pkg): external root = folder containing the exe
// Internal root always follows the code location (so static assets resolve correctly).

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This file lives in: <internalRoot>/src/3-utilities
const INTERNAL_ROOT = path.resolve(__dirname, "..", "..");

// External root (where config/logs live)
const EXTERNAL_ROOT = process.pkg
  ? path.dirname(process.execPath)
  : path.resolve(process.cwd());

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
