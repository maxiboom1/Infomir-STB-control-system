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
