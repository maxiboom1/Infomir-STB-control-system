# STB Zones Control Dashboard
## Macro-Level Functional Description (Compact)

### 1) Project Purpose
Build a centralized web-based system that enables **management and remote control of up to ~200 set-top boxes (STBs)** (typical deployment ~150) from a single dashboard.

Initial onboarding approach (POC stage): **sniff MAGic Remote traffic once** in a test environment (via PCAPdroid), then upload the **PCAP** to learn/control the device.

Current approach (game changer): we discovered that **MAG public firmware enables SSH access**, allowing direct key injection using **sendqtevent** — which is significantly simpler, deterministic, and removes pairing/blob complexity.

---

### 2) Users and Permissions
**System Administrator (Admin)**
- Create / edit / delete **Zones**
- **Add STBs** to the system
- Edit STB details (name, notes, etc.)
- **Assign and move STBs** between zones dynamically

**Operator**
- View zones and STBs
- **Control STBs** via a command pad (based on defined permissions)

---

### 3) Zones
Zones represent logical grouping by site/room/team (for example: “Video Wall”, “Studio A”, “Edit Room 3”).

Within each zone, STBs are displayed as **dynamic tiles/squares**, automatically arranged **left-to-right** (flat view). This provides a clear visual representation of which STBs belong to the zone, without requiring a fixed physical layout.

---

### 4) STB Control Experience (UI Overview)
- Main screen shows **Zones** (left/top) and STB tiles inside each zone.
- Selecting an STB highlights the tile and opens the **remote command pad** area.
- The command pad provides fast operational keys (navigation, OK/Back/Menu, digits, CH+/CH-).
- Each press triggers an immediate backend action and returns **per-action feedback** (success/failure).

Note: The frontend may show only a subset of buttons in the POC, while the backend maintains a **full key map** for future expansion.

---

### 5) Connectivity Strategy (No Continuous Polling)
To maintain performance and avoid unnecessary network load, the system **does not continuously poll all STBs**.

Instead:
- The system **connects on-demand** when a user selects an STB or triggers an action.
- Connection may close after a short idle period, depending on device behavior.
- This approach supports efficient, scalable operation for deployments of 150–200 STBs.

---

### 6) Versions / Environment Notes
- STB model: Infomir MAG540w3, FW: 220 (description: 2.20.10-pub-540), Hardware version: 18C-P0L-00

---

### 7) Protocol notes - SSH is a game changer here
- MAG540w3 devices can be updated with **Public firmware 2.20.10** (installed from soft.infomir.com, not via embedded portal auto-update).
- Public firmware is required in order to **enable SSH access** (Factory / Portal-updated images have SSH locked).
- Remote control is performed via SSH using the built-in **sendqtevent** utility.
- This approach replaces MagicRemote pairing and TCP blob-based control with direct, deterministic key injection. YES!!! 💥
- Root credentials (user: root, password: 930920) are kept default at this stage; password rotation can be automated later once all devices have fixed IPs.

---

## Dev log

### 0.1
- Implemented full layered project structure
- Upload PCAP with device name -> backend parses it and writes device data to SQL
- In case of duplicated name/ip/blob - SQL throws an error and UI displays the reason

### 0.2
- POC ready: user can add and control STBs (MagicRemote-based learning flow)
- UI includes a basic remote pad and device management

### 0.3
- New modern responsive UI including all buttons

### 0.4
- Major simplification: moved control path to **SSH + sendqtevent**
- Backend now maintains a **full keymap** for all supported functions (even if UI shows only a subset)
- Flattened naming convention across routes/services and stabilized “send command” workflow


## POC version 1.0

- We can control and add devices. nice simple user ui. Ready for POC demonstration
