(async () => {
  try {
    await import("./app.js");
  } catch (err) {
    console.error("[FATAL] Failed to start app:", err);
    process.exit(1);
  }
})();