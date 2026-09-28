import { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, tokenStore } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import Icon from '../../components/Icon';

export default function ChatInbox() {
  const { resetChatUnread } = useOutletContext();
  const [sessions, setSessions] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const socketRef = useRef(null);
  const listRef = useRef(null);
  const activeRef = useRef(null); activeRef.current = active;

  useEffect(() => { api.get('/chat/sessions').then(r => setSessions(r.data.items)).catch(() => {}); }, []);

  useEffect(() => {
    const socket = getSocket({ adminToken: tokenStore.access });
    socketRef.current = socket;

    const onUpdate = ({ sessionId, lastMessage, unreadDelta }) => {
      const viewing = activeRef.current?.id === sessionId;
      setSessions(prev => {
        const found = prev.find(s => s.id === sessionId);
        const updated = found
          ? prev.map(s => s.id === sessionId ? { ...s, lastMessage, lastMessageAt: lastMessage.createdAt, unreadForAgent: viewing ? s.unreadForAgent : s.unreadForAgent + (unreadDelta || 0) } : s)
          : [{ id: sessionId, visitorName: lastMessage.senderName, lastMessage, lastMessageAt: lastMessage.createdAt, unreadForAgent: viewing ? 0 : (unreadDelta || 0), status: 'OPEN' }, ...prev];
        return updated.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      });
    };
    const onMessage = ({ sessionId, message }) => {
      if (activeRef.current?.id !== sessionId) return;
      setMessages(prev => prev.some(x => x.id === message.id) ? prev : [...prev, message]);
      if (message.senderRole === 'VISITOR') {
        setTyping(false);
        api.post(`/chat/sessions/${sessionId}/read`).catch(() => {});
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, unreadForAgent: 0 } : s));
      }
    };
    const onTyping = ({ sessionId, typing: t, by }) => by === 'VISITOR' && activeRef.current?.id === sessionId && setTyping(t);
    const onClosed = ({ sessionId }) => {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeRef.current?.id === sessionId) { setActive(null); setMessages([]); }
    };

    socket.on('chat:session-update', onUpdate);
    socket.on('chat:message', onMessage);
    socket.on('chat:typing', onTyping);
    socket.on('chat:session-closed', onClosed);
    return () => {
      socket.off('chat:session-update', onUpdate);
      socket.off('chat:message', onMessage);
      socket.off('chat:typing', onTyping);
      socket.off('chat:session-closed', onClosed);
    };
  }, []);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }); }, [messages, typing]);

  const select = (s) => {
    setActive(s); setTyping(false); setMessages([]);
    socketRef.current?.emit('chat:join', { sessionId: s.id }, (res) => {
      if (res?.ok) {
        api.get(`/chat/sessions/${s.id}/messages`).then(r => setMessages(r.data.items)).catch(() => {});
      }
    });
    setSessions(prev => prev.map(x => x.id === s.id ? { ...x, unreadForAgent: 0 } : x));
    resetChatUnread();
  };

  const send = (e) => {
    e.preventDefault();
    const body = input.trim();
    if (!body || !active) return;
    setInput('');
    socketRef.current?.emit('chat:message', { sessionId: active.id, body }, (res) => {
      if (!res?.ok) setMessages(m => [...m, { id: 'e' + Date.now(), senderRole: 'SYSTEM', senderName: 'ระบบ', body: 'ส่งไม่สำเร็จ: ' + res?.error, createdAt: new Date().toISOString() }]);
    });
  };

  const closeChat = () => { if (active) socketRef.current?.emit('chat:close', { sessionId: active.id }); };

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent-dark">Live Chat Inbox</p>
      <h1 className="mt-1 font-serif text-2xl font-semibold">กล่องข้อความแชท</h1>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-[260px_1fr] border border-ink-line" style={{ height: 'calc(100vh - 220px)', minHeight: 420 }}>
        <div className="overflow-y-auto border-b border-ink-line md:border-b-0 md:border-r dark-scroll">
          {sessions.length === 0 && <p className="p-6 text-center text-xs text-[#6B6555]">ยังไม่มีผู้ติดต่อผ่านแชท</p>}
          {sessions.map(s => (
            <button key={s.id} onClick={() => select(s)} className={`w-full border-b border-ink-line px-4 py-3 text-left ${active?.id === s.id ? 'bg-ink-panel' : 'hover:bg-ink-panel/60'}`}>
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold">{s.visitorName}</span>
                {s.unreadForAgent > 0 && <span className="ml-auto rounded-full bg-accent-dark px-1.5 font-mono text-[10px] font-bold text-ink-deep">{s.unreadForAgent}</span>}
              </div>
              <p className="mt-0.5 truncate text-[11px] text-muted">{s.lastMessage?.body || '—'}</p>
              <p className="font-mono text-[9.5px] text-[#6B6555]">{new Date(s.lastMessageAt).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </button>
          ))}
        </div>

        {active ? (
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center justify-between border-b border-ink-line px-5 py-3">
              <div>
                <p className="text-sm font-semibold">{active.visitorName}</p>
                <p className="font-mono text-[10px] text-[#6B6555]">ห้อง {active.id.slice(0, 8)}…</p>
              </div>
              <button onClick={closeChat} className="border border-ink-line px-3 py-1.5 text-xs text-muted hover:border-accent-dark hover:text-accent-dark">ปิดการสนทนา</button>
            </div>
            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4 dark-scroll">
              {messages.map(m => <AdminBubble key={m.id} m={m} />)}
              {typing && <p className="font-mono text-[11px] text-accent-dark">ผู้ใช้กำลังพิมพ์…</p>}
              {messages.length === 0 && <p className="pt-10 text-center text-xs text-[#6B6555]">เริ่มตอบกลับผู้ใช้ได้เลย</p>}
            </div>
            <form onSubmit={send} className="flex gap-2 border-t border-ink-line p-3">
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="ตอบกลับผู้ใช้…" maxLength={1000}
                className="min-w-0 flex-1 border border-ink-line bg-ink-deep px-3 py-2 text-sm outline-none focus:border-accent-dark" />
              <button className="flex items-center gap-1.5 bg-accent-dark px-4 text-sm font-bold text-ink-deep hover:bg-[#F07C4F]"><Icon name="send" className="h-3.5 w-3.5" />ส่ง</button>
            </form>
          </div>
        ) : (
          <div className="hidden flex-1 items-center justify-center text-sm text-[#6B6555] md:flex">เลือกห้องสนทนาจากด้านซ้าย</div>
        )}
      </div>
    </div>
  );
}

function AdminBubble({ m }) {
  if (m.senderRole === 'SYSTEM') return <p className="text-center font-mono text-[10px] text-[#6B6555]">{m.body}</p>;
  const mine = m.senderRole === 'AGENT';
  return (
    <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
      <span className="mb-0.5 text-[10px] text-muted">{m.senderName} · {new Date(m.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
      <div className={`max-w-[75%] px-3.5 py-2 text-sm leading-6 ${mine ? 'border border-accent-dark/40 bg-accent-dark/15' : 'border border-ink-line bg-ink-panel'}`}>{m.body}</div>
    </div>
  );
}