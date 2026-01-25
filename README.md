# STB Zones Control Dashboard

**Current version:** v1.3.2

### Latest changes (v1.3.2)

- Security: force admin to change default bootstrap password (plaintext "admin").
  - Locked admin APIs return 423 with `forcePasswordChange=true` until updated.
  - New password rules: min 8 chars; cannot be "admin"; cannot contain \\.
  - New UI: `/force-password.html`.
- Logging: added explicit admin audit logs for DB export/import and all admin CRUD operations.
- Admin: added "Backup / Restore" tab.
- Export: download full DB snapshot to JSON (including users, zones, devices, channels map, assignments).
- Import: upload a snapshot JSON and overwrite the DB (optionally keep current admin credentials; import forces re-login).

### 1) Project Purpose
**Problem description:** 

The building is equipped with approximately 150 Infomir MAG-540w3 Set-Top Boxes (STBs). Many are positioned in close proximity to one another, causing remote control (RC) signals to inadvertently affect neighboring devices. Additionally, some STBs are installed behind in-wall mounted screens, making direct RC access unreliable or impossible.

**Solution:** 

Develop a centralized, web-based dashboard for managing and remotely controlling up to ~200 STBs from a single interface. The system leverages the sendqtevent utility available on the public firmware of MAG devices, enabling direct key injection via SSH.
Key features include:

- Robust management of users, permissions, devices (STBs), categories, and zones.
- Backend data storage in Microsoft SQL Server (MSSQL) for easy system snapshots and exports.

---

### 2) Users and Permissions
**System Administrator (Admin)**
- Create, edit, and delete categories and zones.
- Create, edit, and delete STBs.
- Dynamically assign and reassign STBs to zones, and zone to category.
- The admin account is permanent and cannot be deleted or modified.

**Operator**
- View categories, zones, and devices based on assigned permissions.
- Remotely control STBs using a virtual command pad.

---

### 3) Zones and Categories
- Categories and zones provide logical grouping of STBs by location, function, or team (e.g., “Room 1”, “Room 2”, “Room 3”).
- Zones can be nested under categories (e.g., category “Floor 1” containing zones “Room 1” and “Room 2”).
- Within each zone, STBs are displayed as dynamic tiles arranged automatically in a flat, left-to-right layout. This approach offers a clear visual overview of zone membership without enforcing a fixed physical grid.

---

### 4) STB Control Experience (UI Overview)
- The main interface displays categories and zones (e.g., in a sidebar or top navigation), with STB tiles shown for the selected zone.
- Selecting an STB highlights its tile and opens a virtual remote command pad.
- The command pad includes essential operational keys (navigation arrows, OK/Back/Menu, numeric digits, CH+/CH–).
- Each key press triggers an immediate backend action via SSH, with real-time feedback on success or failure.

---

### 5) Connectivity Strategy
The system is designed for low-volume usage, with most sessions involving brief interactions (e.g., entering a channel number, confirming, and closing the interface). Concurrent commands from multiple operators to the same STB are rare.

- Commands are executed using a fire-and-forget approach: each key press establishes a new SSH connection, sends the command, and closes immediately.
- To prevent conflicts, a “busy” state is enforced per STB; simultaneous commands are dropped.
- A command queue may be considered for future enhancements.

This strategy ensures efficient performance and minimal network overhead for deployments of 150–200 STBs.

---

### 6) Hardware Versions / Environment
- **STB Model**: Infomir MAG540w3
- **Firmware:** 2.20.10-pub-540
- **Hardware Version:** 18C-P0L-00

---

### 7) Protocol notes - SSH is a game changer here
SSH access is critical for remote control:

- Devices must be updated to the public firmware version 2.20.10 (available from soft.infomir.com; not via embedded portal auto-update).
- Public firmware enables SSH (locked in factory/portal-updated images).
- Key emulation is performed via the built-in sendqtevent utility over SSH.
- Full list of supported sendqtevent commands: [Keystroke Emulation – Infomir Documentation.](https://wiki.infomir.eu/eng/set-top-box/for-developers/stb-linux-webkit/miscellaneous/keystroke-emulation):
- Default root credentials (user: root, password: 930920) are used at this stage.

---

## Build Windows EXE (pkg)

This project is designed to run as a **local server + local web UI**:
- The UI assets (`webpage/...`) are bundled into the EXE (served internally by Express).
- `config.json` and the `./logs` folder live next to the EXE.

### First run behavior
If `config.json` is missing, the app will **auto-create a template** in the EXE folder and exit.
Edit it and restart.

## Build Windows EXE (pkg)

### Prerequisites
- Node.js 18.x
- SQL Server installed and reachable (site environment)

### Build
```bash
npm install
npm run build:exe
```

### Run
1) Put these in the same folder:
   - `mag-control.exe`
   - `config.json`
2) Run the EXE (console app).
3) Open:
   - `http://localhost:3000/` (or your configured port)

Logs will be written to:
- `./logs/YYYY-MM-DD.log`

---

## Change log

### v1.3.2 - 2026-01-25
- Security: force admin to change default bootstrap password (plaintext "admin").
  - Locked admin APIs return 423 with `forcePasswordChange=true` until updated.
  - Password rules: min 8 chars; cannot be "admin"; cannot contain \\.
  - Added `/force-password.html`.
- Logging: added explicit admin audit logs for DB export/import and all admin CRUD operations.

### v1.3.1 - 2026-01-25
- Admin: added "Backup / Restore" tab.
- Export: download full DB snapshot to JSON (includes users, zones, devices with grid positions, channels map, and user-zone assignments).
- Import: upload a snapshot JSON and overwrite the DB (optional "Keep current admin" preserves current admin credentials; import forces re-login).

### v1.2.2 - 2026-01-19
- Minor style changes in macro view on frontend.


### v1.2.1 - 2026-01-19
- Operator UI: Channels list now uses the same width as the keypad, and Channels/Keypad toggling properly hides the other panel.
- Admin UI: Channels map tab layout fixed (removed accidental accordion/details wrapper; buttons moved to the pane footer like the Devices list).

### v1.2.0 - 2026-01-19
- New: Channels map (1..64) admin tab — configure friendly names for channel macros.
- Operator UI: added "Channels" mode (only named channels are shown).
- Backend: channel macro execution runs digits + configurable delays + OK over a single SSH connection.
- Config: new parameters `macroDigitDelayMs` (default 150) and `macroEnterDelayMs` (default 250).

### v1.1.1 - 2026-01-19
- User UI (desktop): device grid now omits EMPTY cells per row while preserving the original row assignment (row 0 stays row 0, row 1 stays row 1).
- User UI (desktop): fixed device selection click handling for the new grid buttons.

### v1.1.0 - 2026-01-19
- Added per-zone 6x2 device positioning (posIndex 0..11) with swap/move drag & drop in Admin.
- Enforced max 12 assigned devices per zone and unique zone+posIndex in DB.
- Operator UI (desktop): devices displayed in a 6x2 grid with weak-green assigned cells and EMPTY labels.

### v1.0.3 - 2026-01-05
- Added detailed STB command logs (SEND / OK / FAIL / BUSY-DROP) including user + device details.
- Improved fatal error experience in the Windows EXE: if the app stops due to a fatal error (startup/runtime), the console stays open so the error can be read.
- User UI: About modal now includes the company logo and updated version string.

### v1.0.2 - 2026-01-05
- Windows EXE packaging stabilized for ESM project:
  - Added CJS build step using `esbuild` to output `build/app.cjs`.
  - `pkg` now packages the CommonJS bundle instead of trying to run ESM directly.
  - Updated `build:exe` pipeline to: `node scripts/build-cjs.mjs` → `pkg`.
- Clarified runtime filesystem contract for production:
  - `config.json` is read from the EXE folder (auto-created template if missing, then app exits).
  - Logs are written to `./logs` next to the EXE (daily files).

### v1.0.0 — 2026-01-05
- Packaging-ready: static UI assets can be embedded into the Windows EXE via `pkg`.
- Runtime paths hardened: UI assets are served from internal bundled paths; `config.json` and `./logs` are read/written next to the EXE.
- Startup behavior: if `config.json` is missing, a template is auto-created and the app exits with a clear message.
- Logging: all logs are written to daily files under `./logs/YYYY-MM-DD.log`.
- Backend: added centralized Express error middleware + async route wrapper to prevent unhandled async crashes.

### v0.8.6.6 — 2026-01-05
- User UI: footer stays pinned to bottom even before selecting a device (Devices view with keypad still closed).
- Admin Users: improved zone assignment lists — zone name on the left + category badge on the right.

### v0.8.6.5 — 2026-01-05
- User UI: renamed POWER OFF button label to POWER.
- User UI: improved dark styling for native selects (including mobile device picker where supported).
- User UI: ensured keypad is not hidden by footer on small screens (no overlap; safe-area padding).

### v0.8.6.4 — 2026-01-04
- Users: deleting a user now also removes its user→zone assignments (prevents FK conflict).
- Users: improved backend error handling for MSSQL FK violations (error 547) to return a clear message.

### v0.8.6.3 — 2026-01-04
- Backend SSH: per-device (host) busy flag; Bug fixed.
- Added correct POWER command.

### v0.8.6.2 — 2026-01-01
- Admin Devices: restyled filter controls into a single row (Search left + Zone filter right).
- Admin Devices: removed “show categories” toggle and removed “Zone filter” label (default option is “All zones”).

### v0.8.6 — 2026-01-01
- Admin: accordion panes behave as single-open; switching tabs closes all panes.
- Admin Devices: added zone filter dropdown + “show categories” toggle (state resets on page refresh; no localStorage).
- Backend SSH: per-device (host) busy flag; drop commands while busy (returns HTTP 409).
