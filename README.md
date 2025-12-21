# STB Zones Control Dashboard
## Macro-Level Functional Description (Compact)

### 1) Project Purpose
Build a centralized web-based system that enables **management and remote control of up to ~200 set-top boxes (STBs)** (typical deployment ~150) from a single dashboard.

To onboard STBs: we **sniff MagicRemote traffic once** in a test environment. Then the user uploads the captured **PCAP file** to our application, and the system uses it to store the required control parameters for future operation of that STB.

---

### 2) Users and Permissions
**System Administrator (Admin)**
- Create / edit / delete **Zones**
- **Add STBs** to the system (via PCAP)
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

### 4) STB Control Experience
When an STB tile is selected, the UI displays a **command pad** with a defined set of actions (for example: navigation keys Up/Down/Left/Right/OK/Back — the final command list will be agreed with the customer).

Each command is sent immediately, and the system provides clear per-action feedback (success/failure).

---

### 5) Connectivity Strategy (No Continuous Polling)
To maintain performance and avoid unnecessary network load, the system **does not continuously poll all STBs**.

Instead:
- The system **connects on-demand** when a user selects an STB or triggers an action.
- The connection may close after a short idle period (e.g., ~15 seconds), depending on STB behavior—this is sufficient for typical operational workflows.
- This approach supports efficient, scalable operation for deployments of 150–200 STBs.

---

### 6) Versions
- STB model: Infomir MAG540w3, FW: 220 (description: 2.20.10-540), Hardware version: 18C-P0L-00
- Andriod network sniffer application that I used: "PCAPdroid" with targed apps - "MAGic Remote".