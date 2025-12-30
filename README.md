# STB Zones Control Dashboard
## Macro-Level Functional Description (Compact)

### 1) Project Purpose
**Problem description:** Building has 150 STB's. part of them located near each other. When controlling from RC, It affects neigbord STB. Other case is when STB placed behind in-wall mounted screens. RC cannot reach the correct STB.
**Solution:** Build a centralized web-based system that enables management and remote control of up to ~200 set-top boxes (STBs) (typical deployment ~150) from a single dashboard using sendqtevent utility via SSH that available only on MAG public firmware, allowing direct key injection using sendqtevent. The system will provide robust managment system, including users and permissions, device (STB's), categories and zones. In background - we store data in MSSQL, so system snapshot can be exported from there.
---

### 2) Users and Permissions
**System Administrator (Admin)**
- Create / edit / delete **Zones**
- **Add STBs** to the system
- Edit STB details (name, notes, etc.)
- **Assign and move STBs** between zones dynamically.
- Admin user is a constant - and cannot be deleted/edited.

**Operator**
- View categories, zones and devices (based on defined permissions)
- **Control STBs** via a command pad

---

### 3) Zones and Categories
Categories and Zones represent logical grouping by site/room/team (for example: “Video Wall”, “Studio A”, “Edit Room 3”).
Zones can be assigned to categories (For example, cat "Floor-1" has zones "Room-1", "Room-2").

Within each zone, STBs are displayed as **dynamic tiles/squares**, automatically arranged **left-to-right** (flat view). This provides a clear visual representation of which STBs belong to the zone, without requiring a fixed physical layout.

---

### 4) STB Control Experience (UI Overview)
- Main screen shows **Categories** and **Zones** (left/top) and STB tiles inside each zone.
- Selecting an STB highlights the tile and opens the **remote command pad** area.
- The command pad provides fast operational keys (navigation, OK/Back/Menu, digits, CH+/CH-).
- Each press triggers an immediate backend action and returns **per-action feedback** (success/failure).

---

### 5) Connectivity Strategy
In general - we not expecting heavy usage. Most of time system will be idle. There is no scenarion that many operators sends command. Usual case is operator hits CH number, hits OK, and close the interface.

To maintain performance and avoid unnecessary network load, so each command will connect to SSH, send cmd, close connection.

Instead:
- We will use "Fire-and-Forget" strategy ia this stage, and guard with "busy" state and drop command if busy. In case 2 operators send in same time command to same STB. For now, i think its ok, maybe as future plan we can implement command queue. 
- This approach supports efficient, scalable operation for deployments of 150–200 STBs.

---

### 6) Hardware Versions / Environment
- STB model: Infomir MAG540w3, FW: 220 (description: 2.20.10-pub-540), Hardware version: 18C-P0L-00

---

### 7) Protocol notes - SSH is a game changer here
- MAG540w3 devices can be updated with **Public firmware 2.20.10** (installed from soft.infomir.com, not via embedded portal auto-update).
- Public firmware is required in order to **enable SSH access** (Factory / Portal-updated images have SSH locked).
- Remote control is performed via SSH using the built-in **sendqtevent** utility.
- List of available sendqtevent commands [here](https://wiki.infomir.eu/eng/set-top-box/for-developers/stb-linux-webkit/miscellaneous/keystroke-emulation):
- Root credentials (user: root, password: 930920) are kept default at this stage. 

---

## Change log
