import { useCallback, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { Activity, AlertTriangle, CheckCircle2, CirclePlus, Clock3, Headphones, LockKeyhole, LogOut, RefreshCw, Search, ShieldCheck, Truck, Wifi, WifiOff, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL;

export default function App() {
  const [agentName, setAgentName] = useState(() => localStorage.getItem('rd_agent') || '');
  const [nameDraft, setNameDraft] = useState(agentName);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [locks, setLocks] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [resolution, setResolution] = useState('');
  const [status, setStatus] = useState('In Progress');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [showNew, setShowNew] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: '', customer: '', priority: 'Medium', description: '' });

  const selected = tickets.find((ticket) => ticket.id === selectedId) || null;
  const myLock = selected && locks[selected.id]?.socketId === socket?.id;
  const selectedLock = selected ? locks[selected.id] : null;

  const refreshTickets = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/tickets`);
      const data = await response.json();
      if (data.success) setTickets(data.tickets);
    } catch {
      setNotice('Unable to load tickets. Check the API connection.');
    }
  }, []);

  useEffect(() => {
    refreshTickets();
  }, [refreshTickets]);

  useEffect(() => {
    if (!agentName) return undefined;
    const client = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      timeout: 20000
    });
    setSocket(client);

    const onConnect = () => {
      setConnected(true);
      client.emit('join_dashboard', { agentName }, (data) => {
        if (!data?.success) return;
        setTickets(data.tickets);
        setLocks(Object.fromEntries(Object.entries(data.locks).map(([id, lock]) => [id, { ...lock, socketId: null }])));
      });
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = () => setConnected(false);
    const onLocked = (event) => setLocks((prev) => ({ ...prev, [event.ticketId]: { ...event, socketId: event.socketId === client.id ? client.id : null } }));
    const onUnlocked = ({ ticketId }) => setLocks((prev) => {
      const next = { ...prev }; delete next[ticketId]; return next;
    });
    const onCreated = (ticket) => setTickets((prev) => prev.some((item) => item.id === ticket.id) ? prev : [ticket, ...prev]);
    const onUpdated = (ticket) => setTickets((prev) => prev.map((item) => item.id === ticket.id ? ticket : item));

    client.on('connect', onConnect);
    client.on('disconnect', onDisconnect);
    client.on('connect_error', onConnectError);
    client.on('ticket_locked', onLocked);
    client.on('ticket_unlocked', onUnlocked);
    client.on('ticket_created', onCreated);
    client.on('ticket_updated', onUpdated);

    return () => {
      client.off('connect', onConnect);
      client.off('disconnect', onDisconnect);
      client.off('connect_error', onConnectError);
      client.off('ticket_locked', onLocked);
      client.off('ticket_unlocked', onUnlocked);
      client.off('ticket_created', onCreated);
      client.off('ticket_updated', onUpdated);
      client.disconnect();
    };
  }, [agentName]);

  const openTicket = (ticket) => {
    if (!connected || !socket) return setNotice('Connect to the live server before opening a ticket.');
    const lock = locks[ticket.id];
    if (lock && lock.socketId !== socket.id) return setNotice(`This ticket is ${lock.agentName ? `locked by ${lock.agentName}` : 'currently locked'}.`);
    socket.emit('lock_ticket', { ticketId: ticket.id }, (result) => {
      if (!result?.success) {
        setNotice(result?.message || 'Could not acquire ticket lock.');
        return;
      }
      setSelectedId(ticket.id);
      setResolution(ticket.resolution || '');
      setStatus(ticket.status || 'In Progress');
      setNotice('');
    });
  };

  const releaseAndClose = () => {
    if (selectedId && socket && connected && myLock) {
      socket.emit('unlock_ticket', { ticketId: selectedId }, () => {});
    }
    setSelectedId(null);
  };

  const saveTicket = () => {
    if (!selectedId || !socket || !myLock) return;
    socket.emit('save_ticket', { ticketId: selectedId, resolution, status }, (result) => {
      if (!result?.success) {
        setNotice(result?.message || 'Save failed. Your lock may have expired.');
        return;
      }
      setSelectedId(null);
      setNotice('Ticket saved and released for the team.');
    });
  };

  const createTicket = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not create ticket.');
      setNewTicket({ title: '', customer: '', priority: 'Medium', description: '' });
      setShowNew(false);
      setNotice('New ticket broadcast to all connected agents.');
    } catch (error) {
      setNotice(error.message);
    }
  };

  const visibleTickets = useMemo(() => tickets.filter((ticket) => {
    const matchesSearch = `${ticket.id} ${ticket.title} ${ticket.customer}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || ticket.status === filter;
    return matchesSearch && matchesFilter;
  }), [tickets, search, filter]);

  if (!agentName) {
    return <main className="login-screen"><div className="login-card"><div className="brand-mark"><Truck size={28}/></div><p className="eyebrow">PRODESK IT · CLIENT DELIVERY PHASE II</p><h1>RapidDispatch <span>Live Ops</span></h1><p className="muted">Real-time freight support, built for teams that move together.</p><form onSubmit={(e) => { e.preventDefault(); const value = nameDraft.trim(); if (value) { localStorage.setItem('rd_agent', value); setAgentName(value); } }}><label>Agent display name</label><input autoFocus maxLength="32" placeholder="e.g. Agent A" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} required/><button className="primary full" type="submit">Enter live dashboard <span>→</span></button></form><small>Open another browser window with a different agent name to test concurrency.</small></div></main>;
  }

  return <div className="app-shell">
    {!connected && <div className="connection-banner"><WifiOff size={16}/> Connection Lost: Reconnecting... Your changes may not save until connection is restored.</div>}
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><Truck size={22}/></div><div><strong>RapidDispatch</strong><span>LIVE OPS CENTER</span></div></div>
      <div className="top-actions"><div className={`live-pill ${connected ? 'online' : 'offline'}`}><span className="pulse-dot"/>{connected ? 'LIVE CONNECTION' : 'RECONNECTING'}</div><div className="agent-chip"><div className="avatar">{agentName.slice(0,1).toUpperCase()}</div><span>{agentName}</span></div><button className="icon-btn" title="Switch agent" onClick={() => { localStorage.removeItem('rd_agent'); setAgentName(''); }}><LogOut size={17}/></button></div>
    </header>

    <main className="main-content">
      <section className="welcome-row"><div><p className="eyebrow">SUPPORT OPERATIONS / DALLAS, TX</p><h1>Command <span>Center</span></h1><p className="muted">Monitor active freight incidents and coordinate resolutions in real time.</p></div><button className="primary" onClick={() => setShowNew(true)}><CirclePlus size={17}/> Create ticket</button></section>

      <section className="stats-grid">
        <div className="stat-card"><div className="stat-icon blue"><Headphones size={18}/></div><div><span>Active tickets</span><strong>{tickets.filter(t => t.status !== 'Resolved').length}</strong></div><small>Across operations</small></div>
        <div className="stat-card"><div className="stat-icon amber"><AlertTriangle size={18}/></div><div><span>Critical priority</span><strong>{tickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved').length}</strong></div><small>Needs attention</small></div>
        <div className="stat-card"><div className="stat-icon violet"><LockKeyhole size={18}/></div><div><span>Tickets locked</span><strong>{Object.keys(locks).length}</strong></div><small>Agent editing</small></div>
        <div className="stat-card"><div className="stat-icon green"><Activity size={18}/></div><div><span>Connected status</span><strong className="status-word">{connected ? 'Online' : 'Offline'}</strong></div><small>{connected ? 'Sync is active' : 'Waiting for server'}</small></div>
      </section>

      {notice && <div className="notice"><span>{notice}</span><button onClick={() => setNotice('')}><X size={15}/></button></div>}

      <section className="board-card">
        <div className="board-heading"><div><div className="section-title"><span className="title-indicator"/> Live ticket queue</div><p>Updates are streamed instantly to every connected agent.</p></div><div className="board-tools"><div className="search-box"><Search size={16}/><input placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)}/></div><select value={filter} onChange={(e) => setFilter(e.target.value)}><option>All</option><option>Open</option><option>In Progress</option><option>Resolved</option></select><button className="icon-btn" title="Reload list" onClick={refreshTickets}><RefreshCw size={16}/></button></div></div>
        <div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Customer</th><th>Priority</th><th>Status</th><th>Live ownership</th><th></th></tr></thead><tbody>
          {visibleTickets.map((ticket) => {
            const lock = locks[ticket.id];
            const isMine = lock?.socketId && lock.socketId === socket?.id;
            const isLocked = Boolean(lock);
            return <tr key={ticket.id} className={isLocked && !isMine ? 'locked-row' : ''}>
              <td><div className="ticket-id">#{ticket.id}</div><strong className="ticket-title">{ticket.title}</strong></td>
              <td>{ticket.customer}</td>
              <td><span className={`priority ${ticket.priority.toLowerCase()}`}>{ticket.priority}</span></td>
              <td><span className={`status ${ticket.status.toLowerCase().replace(' ', '-')}`}>{ticket.status}</span></td>
              <td>{isLocked ? <span className="lock-owner"><LockKeyhole size={14}/>{isMine ? 'You are editing' : `Locked by ${lock.agentName || 'another agent'}`}</span> : <span className="available"><span/> Available</span>}</td>
              <td><button className="edit-btn" disabled={!connected || (isLocked && !isMine)} onClick={() => openTicket(ticket)}>{isMine ? 'Continue' : 'Edit'} <span>→</span></button></td>
            </tr>;
          })}
          {visibleTickets.length === 0 && <tr><td colSpan="6" className="empty">No tickets match your search.</td></tr>}
        </tbody></table></div>
        <div className="board-footer"><span><span className="footer-dot"/> Live sync enabled</span><span>{visibleTickets.length} of {tickets.length} tickets</span></div>
      </section>
      <footer><span>© 2026 Prodesk IT · RapidDispatch Freight & Logistics</span><span><ShieldCheck size={14}/> Concurrency protected · Socket.IO</span></footer>
    </main>

    {selected && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) releaseAndClose(); }}><section className="ticket-modal"><div className="modal-head"><div><p className="eyebrow">TICKET #{selected.id} · EXCLUSIVE EDIT SESSION</p><h2>{selected.title}</h2><p className="muted">{selected.customer}</p></div><button className="icon-btn" onClick={releaseAndClose}><X size={19}/></button></div><div className="lock-confirm"><LockKeyhole size={16}/> Locked by you. Other agents can view but cannot edit.</div><div className="ticket-context"><span>PRIORITY <b>{selected.priority}</b></span><span>STATUS <b>{selected.status}</b></span></div><div className="description"><label>Incident details</label><p>{selected.description || 'No additional incident details.'}</p></div><label htmlFor="resolution">Resolution notes</label><textarea id="resolution" rows="6" value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Document the action taken, customer communication, and next steps..."/><label htmlFor="ticket-status">Ticket status</label><select id="ticket-status" value={status} onChange={(e) => setStatus(e.target.value)}><option>Open</option><option>In Progress</option><option>Resolved</option></select><div className="modal-actions"><button className="secondary" onClick={releaseAndClose}>Close & release</button><button className="primary" disabled={!connected || !myLock} onClick={saveTicket}><CheckCircle2 size={16}/> Save & release</button></div></section></div>}

    {showNew && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowNew(false); }}><section className="ticket-modal compact"><div className="modal-head"><div><p className="eyebrow">LIVE QUEUE</p><h2>Create support ticket</h2></div><button className="icon-btn" onClick={() => setShowNew(false)}><X size={19}/></button></div><form onSubmit={createTicket}><label>Ticket title</label><input required value={newTicket.title} onChange={(e) => setNewTicket({...newTicket, title:e.target.value})} placeholder="e.g. Delayed freight arrival"/><label>Customer</label><input required value={newTicket.customer} onChange={(e) => setNewTicket({...newTicket, customer:e.target.value})} placeholder="Customer or company name"/><label>Priority</label><select value={newTicket.priority} onChange={(e) => setNewTicket({...newTicket, priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select><label>Incident details</label><textarea rows="3" value={newTicket.description} onChange={(e) => setNewTicket({...newTicket, description:e.target.value})}/><div className="modal-actions"><button type="button" className="secondary" onClick={() => setShowNew(false)}>Cancel</button><button type="submit" className="primary"><CirclePlus size={16}/> Create & broadcast</button></div></form></section></div>}
  </div>;
}
