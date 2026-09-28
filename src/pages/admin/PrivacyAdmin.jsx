import { useEffect, useState } from 'react';
import { api, tokenStore } from '../../lib/api';
import { getSocket } from '../../lib/socket';

const TYPE_LABEL = { ACCESS: 'ขอเข้าถึงข้อมูล', ERASURE: 'ขอลบข้อมูล', WITHDRAW: 'ถอนความยินยอม' };
const STATUS_STYLE = { PENDING: 'border-accent-dark text-accent-dark', COMPLETED: 'border-[#7BC47F] text-[#7BC47F]', REJECTED: 'border-ink-line text-muted' };

export default function PrivacyAdmin() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true); setErr('');
    api.get('/privacy/overview')
      .then(r => setData(r.data))
      .catch(ex => setErr(ex.response?.data?.error || ex.response?.status + ' ' + ex.message || 'โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const socket = getSocket({ adminToken: tokenStore.access });
    socket.on('privacy:new-request', load);
    return () => socket.off('privacy:new-request', load);
  }, []);

  const setStatus = async (id, status) => { await api.patch(`/privacy/requests/${id}`, { status }).catch(ex => setErr(ex.response?.data?.error || 'อัปเดตไม่สำเร็จ')); load(); };

  if (loading) return <div className="p-8 font-mono text-sm text-muted">กำลังโหลด…</div>;

  if (err) return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent-dark">PDPA Compliance</p>
      <h1 className="mt-1 font-serif text-2xl font-semibold">ข้อมูลส่วนบุคคลและความยินยอม</h1>
      <div className="mt-6 border border-accent-dark bg-accent-dark/10 p-5">
        <p className="text-sm font-semibold text-accent-dark">โหลดข้อมูลไม่สำเร็จ</p>
        <p className="mt-1.5 font-mono text-xs text-muted">{err}</p>
        <p className="mt-3 text-xs leading-5 text-muted">เช็คสถานะที่ terminal ของ backend (error จะแสดงบรรทัด [error]) แล้วกดลองใหม่</p>
        <button onClick={load} className="mt-3 border border-accent-dark px-4 py-1.5 text-xs font-semibold text-accent-dark hover:bg-accent-dark/20">ลองใหม่</button>
      </div>
    </div>
  );

  const c = data.consents;

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent-dark">PDPA Compliance</p>
      <h1 className="mt-1 font-serif text-2xl font-semibold">ข้อมูลส่วนบุคคลและความยินยอม</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[['ยินยอมคุกกี้การใช้งาน', c.functionalYes], ['ปฏิเสธคุกกี้การใช้งาน', c.functionalNo], ['ยินยอมก่อนแชท', c.chatYes], ['ถอนความยินยอมแล้ว', c.withdrawn]].map(([label, v]) => (
          <div key={label} className="border border-ink-line bg-ink-panel p-4">
            <b className="block font-mono text-2xl">{v}</b>
            <span className="mt-1 block text-[11px] leading-4 text-muted">{label}</span>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-serif text-lg font-semibold">คำขอใช้สิทธิ์ ({data.requests.length})</h2>
      {data.requests.length === 0 && <p className="mt-2 text-xs text-[#6B6555]">ยังไม่มีคำขอ</p>}
      {data.requests.map(r => (
        <div key={r.id} className="border-t border-ink-line py-3.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`border px-2 py-0.5 font-mono text-[10px] ${STATUS_STYLE[r.status]}`}>{r.status}</span>
            <span className="text-sm font-semibold">{TYPE_LABEL[r.reqType]}</span>
            <span className="font-mono text-[11px] text-muted">{r.contact}</span>
            <span className="ml-auto font-mono text-[10px] text-[#6B6555]">{new Date(r.createdAt).toLocaleString('th-TH')}</span>
          </div>
          {r.detail && <p className="mt-1.5 text-[13px] leading-5 text-muted">{r.detail}</p>}
          {r.status === 'PENDING' && (
            <div className="mt-2 flex gap-2">
              <button onClick={() => setStatus(r.id, 'COMPLETED')} className="border border-ink-line px-3 py-1 text-xs text-muted hover:border-[#7BC47F] hover:text-[#7BC47F]">ดำเนินการเสร็จ</button>
              <button onClick={() => setStatus(r.id, 'REJECTED')} className="border border-ink-line px-3 py-1 text-xs text-muted hover:border-accent-dark hover:text-accent-dark">ปฏิเสธคำขอ</button>
            </div>
          )}
        </div>
      ))}

      <h2 className="mt-10 font-serif text-lg font-semibold">บันทึกการกระทำ (Audit Log) ล่าสุด</h2>
      <div className="mt-2 border-t border-ink-line font-mono text-[11.5px]">
        {data.audits.map(a => (
          <div key={a.id} className="flex flex-wrap gap-x-4 gap-y-0.5 border-b border-ink-line py-2 text-muted">
            <span className="text-[#6B6555]">{new Date(a.createdAt).toLocaleString('th-TH')}</span>
            <span className="w-44 truncate">{a.actorEmail}</span>
            <span className="text-accent-dark">{a.action}</span>
            <span className="truncate">{a.target}</span>
          </div>
        ))}
        {data.audits.length === 0 && <p className="py-3 text-xs text-[#6B6555]">ยังไม่มีบันทึก</p>}
      </div>
    </div>
  );
}