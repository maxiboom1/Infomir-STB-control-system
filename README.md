# STB Zones Control Dashboard

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

## Change log


## Changelog

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
