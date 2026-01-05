Version: v1.0.3
Date: 2026-01-05
Done:
- Added detailed STB action logging: every send command now logs SEND / OK / FAIL / BUSY-DROP (with user + device info).
- Improved fatal error behavior for Windows EXE: on startup/runtime fatal errors, console stays open (Pause) so the error can be read.
- User UI: About modal now shows the I/O Systems logo and updated version string.
Notes:
- Pause is enabled by default only in packaged EXE (pkg). You can force it in dev using MAG_PAUSE_ON_EXIT=1.
----------------------------------------

Version: v1.0.0
Date: 2026-01-05
Done:
- Packaging prep (pkg): assets list + build script added (creates `dist/mag-control.exe`).
- Runtime paths: internal UI assets served from bundled paths; external files (config/logs) resolve to EXE folder.
- Config: if `config.json` is missing, a template is auto-created in the EXE folder and the app exits with a clear message.
- Logger: logs are written to daily files in `./logs/YYYY-MM-DD.log` (folder auto-created).
- Backend stability: centralized Express error middleware + async route wrapper.
Notes:
- `config.json` stays next to the EXE (not bundled). First run can generate the template.
----------------------------------------

Version: v0.8.6.6
Date: 2026-01-05
Done:
- User UI: footer stays pinned to the bottom in Devices view even before selecting a device (drawer stays in layout, hidden until device selection).
- Admin Users: zone assignment lists show zone name (left) + category badge (right, dark green).
Notes:
- Drawer is hidden via visibility so it still fills space and keeps the footer pinned.
----------------------------------------

Version: v0.8.6.5
Date: 2026-01-05
Done:
- User UI: rename POWER OFF button label to POWER.
- User UI: better dark styling hint for native selects (color-scheme: dark + select styling) including the mobile device picker.
- User UI: keypad no longer gets hidden behind the footer on small screens (footer stays in layout; keypad uses safe-area bottom padding).
Notes:
- Some mobile OS dropdown pickers may still show a native white list when opened; closed control is always dark.
----------------------------------------

Version: v0.8.6.4
Date: 2026-01-04
Done:
- Users: delete user now deletes user_zones assignments first (no FK conflict).
- Users: friendly handling for MSSQL FK violation (error 547 / FK_user_zones_user) during delete.
Notes:
- This keeps DB FK constraints intact while making admin UX smoother.
----------------------------------------

Version: v0.8.6.2
Date: 2026-01-01
Done:
- Admin: Devices tab filter UI restyled — single row containing Search (left) + Zone filter (right).
- Devices tab: removed "show categories" toggle and removed "Zone filter" label (default is All zones).
Notes:
- Filter state remains in-memory only until page refresh (no localStorage).
----------------------------------------

Version: v0.8.6
Date: 2026-01-01
Done:
- Admin: single-open accordion behavior across tabs; close all panes on tab switch.
- Devices tab: zone filter dropdown with optional category prefix toggle (no persistence beyond refresh).
- SSH: per-host busy drop (no queue) returning 409 Busy from sendCommand when device is busy.
Notes:
- Filter UI is in-memory only (no localStorage).
- Busy key is host:port:username.
----------------------------------------

Version: v0.6.1
Date: 2025-12-29
Done:
- Refactor: Auth service added - and auth.js only handel routes and link to service
Next:
- Zones/Categories CRUD backend
Notes:
- JWT cookie name: mag_auth
