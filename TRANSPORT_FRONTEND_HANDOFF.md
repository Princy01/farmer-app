## Transport Frontend Status

This repo now has a compatibility bridge to the deployed backend stack, but it is not a full transport UI rewrite yet.

### What was changed

- `src/environments/environment.ts`
  - local API base now defaults to `http://<current-host>:8080`
  - transport realtime base now defaults to `http://<current-host>:8088`
  - devs can override ports without code changes by setting browser localStorage:
    - `localStorage.setItem('apiUrl', 'http://127.0.0.1:3000')`
    - `localStorage.setItem('transportRealtimeUrl', 'http://127.0.0.1:8088')`
    - `localStorage.setItem('translateApiUrl', 'http://127.0.0.1:8000')`

- `src/environments/environment.prod.ts`
  - production now uses `window.location.origin` instead of hardcoded `160.250.204.132:3000`
  - this assumes nginx/reverse proxy will serve the PWA and proxy API routes on the same public origin

- `src/app/transport/transport-requests/transport-requests.service.ts`
  - open jobs now read from transport realtime `GET /api/driver/jobs/open`
  - accept now calls `POST /api/driver/jobs/{ride_id}/accept` with `attempt_no`
  - reject now calls `POST /api/driver/jobs/{ride_id}/reject` with `attempt_no`
  - legacy driver availability endpoints remain on the main backend for now

- `src/app/transport/transport-requests/transport-requests.component.ts`
  - request cards now tolerate the slimmer realtime payload
  - pickup/drop read top-level realtime fields first
  - city/area is shown when distance is not available

- `src/app/transport/delivery-history/delivery-history.service.ts`
  - FE now consistently prefers `dropoff_branch.branch_address` over duplicate/stale `delivery_address`

### Known remaining gaps

1. Browser websocket integration is still pending.
   - Current backend `/ws/driver` only accepts Bearer auth in the `Authorization` header.
   - Browser WebSocket clients cannot send arbitrary headers.
   - Backend needs one of:
     - query-param token support, or
     - cookie/session auth, or
     - `Sec-WebSocket-Protocol` token handling

2. Transport request cards still expect richer data than realtime currently returns.
   - current realtime open jobs do not include nested orders, item counts, distance, or urgency
   - UI now degrades gracefully, but a final design pass is still needed

3. Driver availability and some transport settings still use old main-backend endpoints.
   - that is intentional for now to avoid a larger FE break

4. Location preferences are still FE-local.
   - branch-level filtering is not enforced by the realtime backend yet

### Backend cleanup recommended from screenshot review

For delivery responses, FE should treat `pickup_branch` and `dropoff_branch` as source-of-truth addresses.

Recommended BE cleanup:
- stop sending duplicate/stale top-level delivery address fields when `dropoff_branch` is present
- keep one clear pickup source and one clear drop source

### Deployment assumption

The production environment file now assumes same-origin deployment:
- PWA served by nginx
- nginx proxies backend and transport realtime routes on the same public host

If you deploy frontend and API on different domains, update:
- `apiUrl`
- `transportRealtimeUrl`
