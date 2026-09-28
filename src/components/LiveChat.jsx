import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { getSocket, disconnectSocket } from '../lib/socket';
import { hasFunctional } from '../lib/consent';
import Icon from './Icon';

const fmtTime = (iso) => new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

export default function LiveChat() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(() => {
    if (!hasFunctional()) return '';
    try { return localStorage.getItem('chat.name') || ''; } catch { return ''; }
  });
  const [session, setSession] = useState(() => {
    if (!hasFunctional()) return null;
    try { return JSON.parse(localStorage.getItem('chat.session') || 'null'); } catch { return null; }
  });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const [connected, setConnected] = useState(false);
  const [agree, setAgree] = useState(false);

  const socketRef = useRef(null);
  const openRef = useRef(open); openRef.current = open;
  const listRef = useRef(null);
  const lastTyping = useRef(0);

  const connect = (s) => {
    disconnectSocket();
    const socket = getSocket({ visitorToken: s.visitorToken });
    socketRef.current = socket;
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('chat:join', { sessionId: s.id }, (res) => {
        if (res?.ok) api.get(`/chat/sessions/${s.id}/messages`, { headers: { 'x-visitor-token': s.visitorToken } })
          .then(r => setMessages(r.data.items)).catch(() => {});
      });
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('chat:message', ({ sessionId, message }) => {
      if (sessionId !== s.id) return;
      setMessages(prev => prev.some(m => m.id === message.id) ? prev : [...prev, message]);
      if (message.senderRole === 'AGENT') setTyping(false);
      if (message.senderRole === 'AGENT' && !openRef.current) setUnread(u => u + 1);
    });
    socket.on('chat:typing', ({ typing: t, by }) => by === 'AGENT' && setTyping(t));
  };

  useEffect(() => { if (open && session && !socketRef.current) connect(session); }, [open]);
  useEffect(() => () => disconnectSocket(), []);
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }); }, [messages, typing, open]);

  const sysMsg = (body) => ({ id: 'e' + Date.now(), senderRole: 'SYSTEM', senderName: 'ระบบ', body, createdAt: new Date().toISOString() });

  const startChat = async (e) => {
    e.preventDefault();
    const n = name.trim();
    if (n.length < 2 || !agree) return;
    try {
      const { data } = await api.post('/chat/sessions', { name: n, consent: true });
      const s = { id: data.session.id, visitorToken: data.visitorToken };
      if (hasFunctional()) localStorage.setItem('chat.session', JSON.stringify(s));
      setSession(s); connect(s);
    } catch (ex) {
      setMessages(m => [...m, sysMsg(ex.response?.data?.error || 'เริ่มแชทไม่สำเร็จ กรุณาลองใหม่ภายหลัง')]);
    }
  };

  const send = (e) => {
    e.preventDefault();
    const body = input.trim();
    if (!body || !socketRef.current || !session) return;
    setInput('');
    socketRef.current.emit('chat:message', { sessionId: session.id, body }, (res) => {
      if (!res?.ok) setMessages(m => [...m, sysMsg('ส่งข้อความไม่สำเร็จ: ' + (res?.error || 'ลองใหม่'))]);
    });
  };

  const onType = (v) => {
    setInput(v);
    const now = Date.now();
    if (socketRef.current && session && (v.length > 0 || now - lastTyping.current > 1500)) {
      lastTyping.current = now;
      socketRef.current.emit('chat:typing', { sessionId: session.id, typing: v.length > 0 });
    }
  };

  // ปุ่มถังขยะ = ใช้สิทธิ์ลบข้อมูล — ลบจากเซิร์ฟเวอร์จริง ไม่ใช่แค่ซ่อน
  const endChat = async () => {
    const s = session;
    disconnectSocket(); socketRef.current = null;
    localStorage.removeItem('chat.session');
    setSession(null); setMessages([]); setOpen(false); setConnected(false);
    if (s?.visitorToken) await api.delete('/privacy/my-data', { headers: { 'x-visitor-token': s.visitorToken } }).catch(() => {});
  };

  return (
    <>
      <button onClick={() => { setOpen(o => !o); setUnread(0); }}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-accent text-paper shadow-lg transition-transform hover:-translate-y-0.5">
        <Icon name={open ? 'x' : 'chat'} className="h-6 w-6" />
        {unread > 0 && !open && <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border border-ink bg-paper px-1 font-mono text-[10px] font-bold text-accent">{unread}</span>}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 flex h-[480px] w-[350px] max-w-[calc(100vw-3rem)] flex-col border-2 border-ink bg-paper-hi shadow-hard">
          <div className="flex items-center justify-between border-b-2 border-ink bg-ink px-4 py-3 text-paper">
            <div>
              <p className="font-serif font-semibold">สอบถามเจ้าหน้าที่</p>
              <p className="flex items-center gap-1.5 font-mono text-[10px] text-muted">
                <i className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-[#7BC47F]' : 'bg-accent-dark'}`} />
                {connected ? 'ออนไลน์' : 'กำลังเชื่อมต่อ…'}
              </p>
            </div>
            <div className="flex gap-1">
              {session && <button onClick={endChat} title="ลบข้อมูลแชทของฉัน (จากเซิร์ฟเวอร์ด้วย)" className="p-1.5 text-muted hover:text-paper"><Icon name="trash" className="h-4 w-4" /></button>}
              <button onClick={() => setOpen(false)} className="p-1.5 text-muted hover:text-paper"><Icon name="x" className="h-4 w-4" /></button>
            </div>
          </div>

          {!session ? (
            <form onSubmit={startChat} className="flex flex-1 flex-col justify-center gap-3 px-6">
              <p className="font-serif text-lg font-semibold">ยินดีให้คำปรึกษา</p>
              <p className="text-sm leading-6 text-ink-soft">กรอกชื่อเพื่อเริ่มสนทนา ระบบจะส่งต่อให้เจ้าหน้าที่ทันที</p>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อของคุณ" autoFocus
                className="border-2 border-ink bg-paper px-3 py-2.5 text-sm outline-none focus:shadow-hard" />
              <label className="flex items-start gap-2 text-[12px] leading-5 text-ink-soft">
                <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[#B5401F]" />
                <span>ข้าพเจ้ายินยอมให้เก็บชื่อและข้อความเพื่อการให้บริการตาม{' '}
                  <Link to="/privacy" className="font-semibold text-accent underline">นโยบายความเป็นส่วนตัว</Link></span>
              </label>
              <button disabled={name.trim().length < 2 || !agree} className="border-2 border-ink bg-ink py-2.5 text-sm font-semibold text-paper disabled:opacity-40">เริ่มแชท</button>
              {!hasFunctional() && <p className="text-[11px] leading-5 text-ink-soft">โหมดไม่จดจำ: เบราว์เซอร์ของคุณจะไม่บันทึกห้องแชทนี้ — การปิดหน้าต่างจะทำให้กลับเข้าแชทเดิมไม่ได้</p>}
            </form>
          ) : (
            <>
              <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
                {messages.map(m => <Bubble key={m.id} m={m} />)}
                {typing && <p className="flex items-center gap-1.5 font-mono text-[11px] text-ink-soft"><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />เจ้าหน้าที่กำลังพิมพ์…</p>}
                {messages.length === 0 && <p className="pt-10 text-center text-xs text-ink-soft">ส่งข้อความเพื่อเริ่มบทสนทนา</p>}
              </div>
              <form onSubmit={send} className="flex gap-2 border-t border-line bg-paper p-3">
                <input value={input} onChange={e => onType(e.target.value)} placeholder="พิมพ์ข้อความ…" maxLength={1000}
                  className="min-w-0 flex-1 border border-line bg-paper-hi px-3 py-2 text-sm outline-none focus:border-ink" />
                <button className="flex items-center bg-ink px-3 text-paper hover:bg-accent"><Icon name="send" className="h-4 w-4" /></button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}

function Bubble({ m }) {
  if (m.senderRole === 'SYSTEM') return <p className="text-center font-mono text-[10.5px] text-ink-soft">{m.body}</p>;
  const mine = m.senderRole === 'VISITOR';
  return (
    <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
      {!mine && <span className="mb-0.5 text-[10.5px] font-semibold text-accent">{m.senderName}</span>}
      <div className={`max-w-[80%] px-3.5 py-2 text-sm leading-6 ${mine ? 'border border-accent/30 bg-accent-soft' : 'border border-ink/15 bg-paper-lo'}`}>{m.body}</div>
      <span className="mt-0.5 font-mono text-[9.5px] text-ink-soft">{fmtTime(m.createdAt)}</span>
    </div>
  );
}