import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { randomUUID } from 'crypto';

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser tools (curl/health checks) with no Origin header.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
};

app.use(cors(corsOptions));
app.use(express.json());

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
});

const tickets = new Map();
const locks = new Map(); // ticketId -> { socketId, agentName, lockedAt }

const seedTickets = [
  { id: '105', title: 'Truck breakdown — I-35 North', customer: 'Lone Star Retail', priority: 'Critical', status: 'Open', description: 'Vehicle RD-204 reported engine trouble near Denton, TX.', resolution: '' },
  { id: '106', title: 'Missed delivery window', customer: 'Metro Supply Co.', priority: 'High', status: 'Open', description: 'Shipment arrived after the agreed delivery window.', resolution: '' },
  { id: '107', title: 'Duplicate freight charge', customer: 'Westfield Stores', priority: 'Medium', status: 'In Progress', description: 'Customer reports two charges for shipment FR-8812.', resolution: '' },
  { id: '108', title: 'POD document unavailable', customer: 'Cedar Wholesale', priority: 'Low', status: 'Open', description: 'Proof-of-delivery attachment is not visible in portal.', resolution: '' },
  { id: '109', title: 'Shipment tracking mismatch', customer: 'Northstar Foods', priority: 'Medium', status: 'Open', description: 'Tracking page shows a stale location for shipment NS-442.', resolution: '' }
];
seedTickets.forEach((ticket) => tickets.set(ticket.id, ticket));

const publicTicket = (ticket) => ({ ...ticket });
const currentLocks = () => Object.fromEntries(
  [...locks.entries()].map(([ticketId, lock]) => [ticketId, {
    agentName: lock.agentName,
    lockedAt: lock.lockedAt
  }])
);

app.get('/health', (_req, res) => {
  res.json({ success: true, service: 'RapidDispatch Live Ops API', timestamp: new Date().toISOString(), connectedAgents: io.engine.clientsCount });
});

app.get('/api/tickets', (_req, res) => {
  res.json({ success: true, tickets: [...tickets.values()].map(publicTicket) });
});

app.post('/api/tickets', (req, res) => {
  const { title, customer, priority = 'Medium', description = '' } = req.body || {};
  if (!title?.trim() || !customer?.trim()) {
    return res.status(400).json({ success: false, message: 'Ticket title and customer are required.' });
  }
  const ticket = {
    id: randomUUID().slice(0, 8).toUpperCase(),
    title: title.trim(),
    customer: customer.trim(),
    priority,
    status: 'Open',
    description: description.trim(),
    resolution: ''
  };
  tickets.set(ticket.id, ticket);
  io.emit('ticket_created', publicTicket(ticket));
  return res.status(201).json({ success: true, ticket });
});

io.on('connection', (socket) => {
  socket.data.agentName = 'Agent';

  socket.on('join_dashboard', (payload = {}, ack = () => {}) => {
    const agentName = String(payload.agentName || 'Agent').trim().slice(0, 32) || 'Agent';
    socket.data.agentName = agentName;
    socket.join('dashboard');
    ack({
      success: true,
      agentName,
      tickets: [...tickets.values()].map(publicTicket),
      locks: currentLocks()
    });
  });

  socket.on('lock_ticket', (payload = {}, ack = () => {}) => {
    const ticketId = String(payload.ticketId || '');
    if (!tickets.has(ticketId)) return ack({ success: false, message: 'Ticket not found.' });

    const existing = locks.get(ticketId);
    if (existing && existing.socketId !== socket.id) {
      return ack({ success: false, message: `Locked by ${existing.agentName}.`, lock: { agentName: existing.agentName } });
    }
    if (existing?.socketId === socket.id) {
      return ack({ success: true, lock: { agentName: existing.agentName, lockedAt: existing.lockedAt } });
    }

    const lock = { socketId: socket.id, agentName: socket.data.agentName, lockedAt: new Date().toISOString() };
    locks.set(ticketId, lock);
    const event = { ticketId, agentName: lock.agentName, socketId: socket.id, lockedAt: lock.lockedAt };
    io.to('dashboard').emit('ticket_locked', event);
    ack({ success: true, lock: { agentName: lock.agentName, lockedAt: lock.lockedAt } });
  });

  socket.on('unlock_ticket', (payload = {}, ack = () => {}) => {
    const ticketId = String(payload.ticketId || '');
    const existing = locks.get(ticketId);
    if (!existing || existing.socketId !== socket.id) {
      return ack({ success: false, message: 'This agent does not own the ticket lock.' });
    }
    locks.delete(ticketId);
    io.to('dashboard').emit('ticket_unlocked', { ticketId, agentName: existing.agentName, reason: 'released' });
    ack({ success: true });
  });

  socket.on('save_ticket', (payload = {}, ack = () => {}) => {
    const ticketId = String(payload.ticketId || '');
    const existing = locks.get(ticketId);
    if (!existing || existing.socketId !== socket.id) {
      return ack({ success: false, message: 'Save rejected: you do not own this ticket lock.' });
    }
    const current = tickets.get(ticketId);
    if (!current) return ack({ success: false, message: 'Ticket not found.' });

    const updated = {
      ...current,
      resolution: String(payload.resolution ?? current.resolution).slice(0, 5000),
      status: ['Open', 'In Progress', 'Resolved'].includes(payload.status) ? payload.status : current.status
    };
    tickets.set(ticketId, updated);
    locks.delete(ticketId);
    io.to('dashboard').emit('ticket_updated', publicTicket(updated));
    io.to('dashboard').emit('ticket_unlocked', { ticketId, agentName: existing.agentName, reason: 'saved' });
    ack({ success: true, ticket: publicTicket(updated) });
  });

  socket.on('disconnect', (reason) => {
    // Ghost-lock cleanup: release every ticket owned by this exact socket.
    for (const [ticketId, lock] of locks.entries()) {
      if (lock.socketId === socket.id) {
        locks.delete(ticketId);
        io.to('dashboard').emit('ticket_unlocked', {
          ticketId,
          agentName: lock.agentName,
          reason: 'disconnect'
        });
      }
    }
    console.log(`Socket ${socket.id} disconnected: ${reason}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`RapidDispatch API + Socket.IO listening on ${PORT}`));
