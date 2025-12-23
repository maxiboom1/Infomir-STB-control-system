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

### 7) Protocol notes - SSH is an game changer here

- MAG540w3 devices can be updated with Public firmware 2.20.10 (installed from soft.infomir.com, not via embedded portal auto-update).
- Public firmware is required in order to enable SSH access (Factory / Portal-updated images have SSH locked).
- Remote control is performed via SSH using the built-in sendqtevent utility.
- This approach replaces MagicRemote pairing and TCP blob-based control with direct, deterministic key injection. YES!!! 💥
- Root credentials (user: root, password: 930920)are kept default at this stage; password rotation can be automated later once all devices have fixed IPs.


## Dev log

### 0.1
- Implemented full layered project structure
- Currently - we can upload pcap with device name, to route handler ==> stbService.addNewStb(device, name), it will use utility to parse pcap and then write it to sql device table
- In case of duplicated name/ip/blob - sql will throw err with reason - we show it to user.

## 0.2

- POC ready project - user can add and control stb's. Added keymap to devices table - since unfortunatelly, each stb generates uniq control set commands. 
- Learning became a bit more complicated - user must click on those buttons in MagicRemote app - in this sequence:
    ```
        "1","2","3","4","5","6","7","8","9","0",
        "CH_PLUS","CH_MINUS",
        "UP","RIGHT","DOWN","LEFT",
        "OK","RETURN","HOME","MENU"
    ```
This part is annoing - but we cant bypass it.


## 0.3

- New modern responsive ui including all buttons.