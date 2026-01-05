import { build } from "esbuild";

await build({
  entryPoints: ["app.js"],
  outfile: "build/app.cjs",
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node18",
  sourcemap: false,
  // keep node_modules externals as-is (safe for mssql/ssh2)
  packages: "external",
  logLevel: "info",
});
