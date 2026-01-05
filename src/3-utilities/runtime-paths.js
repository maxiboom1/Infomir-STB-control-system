import path from "path";

function getPkgInternalRoot() {
  // process.pkg.entrypoint points to snapshot entry file, e.g.:
  // C:\snapshot\Infomir-STB-control-system\build\app.cjs
  const ep = process.pkg?.entrypoint;
  if (!ep) return null;

  const epDir = path.dirname(ep);
  // if entry is inside \build, internal root is its parent
  if (path.basename(epDir).toLowerCase() === "build") {
    return path.dirname(epDir);
  }
  return epDir;
}

const INTERNAL_ROOT = process.pkg
  ? (getPkgInternalRoot() || process.cwd())
  : process.cwd();

// External root (where config/logs live)
const EXTERNAL_ROOT = process.pkg
  ? path.dirname(process.execPath)
  : process.cwd();

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
