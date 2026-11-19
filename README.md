# RapidDispatch Live Ops Helpdesk — Sprint 19

A full-stack real-time collaborative support-ticket board built with React, Vite, Node.js, Express, and Socket.IO.

## Features
- Live ticket board; new tickets are pushed to all connected agents without polling.
- Real-time ticket presence and exclusive edit locks.
- Server-owned `Map` is the source of truth for locks.
- Lock requests are atomic within the Node.js event loop; competing requests are rejected.
- Save is accepted only from the socket that currently owns the lock.
- Locks are released on explicit unlock, save, close, and unexpected socket disconnect.
- Disconnect/reconnect banner and automatic Socket.IO reconnection.
- Agent names, ticket creation, status updates, and demo seed data.
- Vercel and Render deployment configuration.

## Project structure
```text
RapidDispatch-Live-Ops/
├── backend/
│   ├── src/server.js
│   ├── package.json
│   ├── render.yaml
│   └── .env.example
├── frontend/
│   ├── src/App.jsx
│   ├── src/main.jsx
│   ├── src/styles.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json
│   └── .env.example
├── Prompts.md
└── README.md
```

## Run locally

### 1. Backend
```bash
cd backend
npm install
copy .env.example .env
npm run dev
```
Backend runs at `http://localhost:5000`. Health check: `http://localhost:5000/health`.

### 2. Frontend (new terminal)
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```
Open `http://localhost:5173` in two separate browser windows. Use two different agent names, such as `Agent A` and `Agent B`.

> On macOS/Linux, use `cp .env.example .env` instead of `copy`.

## Environment variables

### Backend
- `PORT`: Render supplies this automatically; defaults to `5000`.
- `CLIENT_ORIGIN`: comma-separated exact frontend origins. For local development use `http://localhost:5173`. For production use your Vercel URL, e.g. `https://your-app.vercel.app`. Multiple origins may be comma-separated.

### Frontend
- `VITE_API_URL`: backend origin, e.g. `http://localhost:5000`.
- `VITE_SOCKET_URL`: Socket.IO backend origin, normally the same as `VITE_API_URL`.

Do not put secrets in `VITE_` variables; frontend values are public.

## Production deployment

### Render (backend)
1. Push this project to GitHub.
2. In Render, create **New + → Web Service** and select the repository.
3. Set **Root Directory** to `backend`.
4. Build command: `npm install`
5. Start command: `npm start`
6. Add `CLIENT_ORIGIN=https://YOUR-VERCEL-DOMAIN.vercel.app`.
7. Deploy and copy the Render service URL, e.g. `https://your-api.onrender.com`.

The backend supports Socket.IO over HTTPS/WSS automatically when hosted behind Render's TLS proxy.

### Vercel (frontend)
1. Import the same repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Framework preset: Vite.
4. Build command: `npm run build`; output directory: `dist`.
5. Add:
   - `VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com`
   - `VITE_SOCKET_URL=https://YOUR-RENDER-SERVICE.onrender.com`
6. Redeploy after adding environment variables.
7. Update Render's `CLIENT_ORIGIN` to the exact Vercel deployment URL and redeploy backend.

If using a Vercel preview URL, add that exact origin to `CLIENT_ORIGIN` too. Avoid `*` in production.

## Socket event contract

| Event | Direction | Purpose |
|---|---|---|
| `join_dashboard` | client → server | Register agent name and join dashboard room |
| `dashboard_joined` | server → client | Initial tickets and current locks |
| `lock_ticket` | client → server | Request exclusive lock; acknowledgement reports granted/rejected |
| `ticket_locked` | server → all | Broadcast successful lock |
| `unlock_ticket` | client → server | Release lock if caller owns it |
| `ticket_unlocked` | server → all | Broadcast release |
| `save_ticket` | client → server | Save only if caller owns lock; acknowledgement returns updated ticket |
| `ticket_updated` | server → all | Broadcast saved ticket |
| `ticket_created` | server → all | Broadcast new ticket |
| `disconnect` | socket lifecycle | Release all locks owned by disconnected socket |

## Important concurrency notes
- The lock `Map` lives in the backend process and is the authoritative lock registry.
- A lock record contains `socketId`, `agentName`, and `lockedAt`.
- The server checks and sets the Map synchronously before acknowledging. Two concurrent lock requests cannot both win in one Node process.
- The `save_ticket` handler checks the current socket ID before mutating ticket data. A stale tab cannot overwrite another agent's work.
- Disconnect cleanup scans the Map, deletes every lock belonging to the disconnecting socket, and broadcasts each release.
- This demo uses in-memory tickets and locks. A Render restart or multiple backend instances will reset/split state. For a real production deployment, persist tickets in a database and use Redis (Socket.IO Redis adapter plus distributed lock/lease strategy) for cross-instance coordination. Add authenticated user identity and authorization before handling real customer data.

## Demo checklist (required dual-window video)
1. Open the Vercel URL in two side-by-side windows.
2. Enter `Agent A` in Window 1 and `Agent B` in Window 2.
3. Click the same ticket in Window 1.
4. Confirm Window 2 immediately shows a gray row, lock icon, and `Locked by Agent A`; its edit button is disabled.
5. Try clicking Edit in Window 2; it must be disabled.
6. Save or close in Window 1; confirm Window 2 becomes editable.
7. For the ghost-disconnect test, lock a ticket in Window 1, then close that tab. Window 2 should receive the unlock broadcast automatically.
8. Record the two windows and upload the demo video with the GitHub and deployment URLs.

## Troubleshooting
- Check browser DevTools → Network → WS. You should see a Socket.IO connection.
- Confirm `VITE_SOCKET_URL` points to the Render service, not the Vercel frontend.
- Confirm Render `CLIENT_ORIGIN` exactly matches the browser's Vercel origin (scheme and hostname).
- After changing Vercel environment variables, redeploy.
- If the browser shows a CORS error, inspect both Render logs and the browser console.
- If Render free service is sleeping, the first request may take time to wake it.

## Scripts
Backend: `npm run dev`, `npm start`
Frontend: `npm run dev`, `npm run build`, `npm run preview`
