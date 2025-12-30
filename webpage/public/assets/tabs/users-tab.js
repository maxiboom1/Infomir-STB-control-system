/**
 * users-tab.js — Users tab wiring (placeholder)
 *
 * v0.7.7: Users UI skeleton exists, wiring will be implemented after Devices.
 */

export function initUsersTab(shared) {
  // Keep module shape stable for future wiring.
  const { setStatus } = shared;

  let inited = false;

  function initOnce() {
    if (inited) return;
    inited = true;
    // No wiring yet.
  }

  return {
    onShow() {
      initOnce();
      setStatus("Users tab (wiring pending)");
    }
  };
}
