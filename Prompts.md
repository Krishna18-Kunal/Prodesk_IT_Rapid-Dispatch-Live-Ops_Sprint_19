# Prompts.md — AI Usage & Transparency

This file records representative AI assistance used while planning and implementing Sprint 19. Update it to reflect the actual prompts and assistance used by your team.

## 1. Architecture planning
**Prompt:** Design a full-stack real-time support ticket helpdesk using React, Express, and Socket.IO. Include a live ticket board, exclusive ticket locks, lock ownership, save validation, explicit unlock, and automatic lock cleanup on disconnect. Explain the event flow and deployment topology.

**Applied:** Separated REST ticket loading/creation from Socket.IO real-time coordination. The backend owns the in-memory ticket collection and lock Map.

## 2. Race-condition prevention
**Prompt:** Show how to prevent two Socket.IO clients from acquiring the same ticket lock. Use a JavaScript Map keyed by ticket ID and ensure the check-and-set happens synchronously before acknowledging the request.

**Applied:** The `lock_ticket` handler checks the Map and writes the lock in one synchronous handler path. A competing request receives a rejected acknowledgement containing the current lock owner.

## 3. Preventing stale overwrites
**Prompt:** How can the server prevent an agent with an old browser tab from overwriting a ticket after another agent acquired its lock?

**Applied:** The `save_ticket` event verifies that the current lock exists and its `socketId` equals the saving socket's ID. The server, not the browser, decides whether the write is accepted.

## 4. Ghost disconnect cleanup
**Prompt:** Implement a Socket.IO disconnect handler that finds all ticket locks owned by the disconnected socket ID, deletes them, and broadcasts an unlock event for every ticket.

**Applied:** The backend iterates over the Map during `disconnect`, deletes matching records, and emits `ticket_unlocked`.

## 5. React Strict Mode and socket lifecycle
**Prompt:** Explain why React Strict Mode may run effect setup and cleanup more than once in development, and show a safe Socket.IO client lifecycle that removes listeners and disconnects the socket during cleanup.

**Applied:** The socket is created in a React effect, event listeners are registered there, and listeners are removed before disconnecting in cleanup. Development logs may show an extra connect/disconnect cycle under Strict Mode; this is expected and must not create duplicate listeners.

## 6. Production CORS and WSS
**Prompt:** Configure Express and Socket.IO CORS so a Vercel-hosted Vite frontend can connect securely to a Render-hosted Node backend over HTTPS/WSS. Use an explicit environment variable for allowed origins.

**Applied:** The backend reads `CLIENT_ORIGIN`; the frontend reads `VITE_API_URL` and `VITE_SOCKET_URL`. Production deployments must use the exact Vercel origin and HTTPS backend URL.

## 7. Manual QA
**Prompt:** Create a dual-browser-window test plan for ticket locking, rejection of a competing lock, save authorization, explicit unlock, and automatic unlock after closing the lock owner's tab.

**Applied:** The full demo checklist is included in `README.md`.

## AI transparency note
AI assistance was used for implementation planning, code drafting, debugging guidance, documentation structure, and test-case design. The engineering team remains responsible for reviewing, testing, and understanding all submitted code. Replace or supplement these examples with the exact prompts used during your own development.
