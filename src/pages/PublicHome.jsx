import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';   // ← เพิ่มบรรทัดนี้
import { api } from '../lib/api';
import { highlight } from '../lib/highlight';
import Icon from '../components/Icon';
import LiveChat from '../components/LiveChat';

const PAGE_SIZE = 12;
const fmtDate = (iso) => new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

export default function PublicHome() {
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [type, setType] = useState('ALL');
  const [tag, setTag] = useState(null);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0 });
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(() => new Set());
  const searchRef = useRef(null);

  useEffect(() => { const t = setTimeout(() => { setDq(q.trim()); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);

  useEffect(() => { api.get('/systems/meta').then(r => setMeta(r.data)).catch(() => { }); }, [data.total]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    api.get('/systems', { params: { q: dq || undefined, type: type === 'ALL' ? undefined : type, tag: tag || undefined, page, pageSize: PAGE_SIZE } })
      .then(r => live && setData(r.data))
      .catch(() => live && setData({ items: [], total: 0 }))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [dq, type, tag, page]);

  useEffect(() => {
    const h = (e) => {
      const t = e.target.tagName;
      if (e.key === '/' && t !== 'INPUT' && t !== 'TEXTAREA') { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const toggle = (id) => setOpen(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const core = data.items.filter(i => i.type === 'CORE');
  const ext = data.items.filter(i => i.type === 'EXTERNAL');
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <div className="relative min-h-screen">
      <div className="paper-noise" />
      <div className="relative z-10 mx-auto max-w-5xl px-6 pb-24">

        <header className="flex items-center justify-between border-b-2 border-ink py-4 text-sm">
          <div className="flex items-center gap-2 font-semibold"><span className="h-2.5 w-2.5 bg-accent" />ศูนย์รวมระบบและบริการองค์กร</div>
          <span className="font-mono text-xs text-ink-soft">API · LIVE</span>
        </header>

        <div className="pt-12">
          <p className="mb-3 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft before:h-0.5 before:w-8 before:bg-accent before:content-['']">Service Registry · Online</p>
          <h1 className="font-serif text-5xl font-bold leading-tight md:text-7xl">ทะเบียนระบบงาน</h1>
          <p className="mt-4 max-w-2xl leading-7 text-ink-soft">รวมทุกระบบงานและบริการไว้ในหน้าเดียว ค้นหาได้ทันทีจากเซิร์ฟเวอร์ รองรับรายการที่เพิ่มขึ้นเรื่อยๆ พร้อมแชทสอบถามเจ้าหน้าที่ได้โดยตรง</p>
          <div className="mt-8 flex border-t border-line pt-5">
            {[['รายการทั้งหมด', meta?.total], ['ระบบหลัก', meta?.core], ['ลิงก์ภายนอก', meta?.external], ['แท็กในระบบ', meta?.tags?.length]].map(([label, v]) => (
              <div key={label} className="border-l border-line px-6 first:border-l-0 first:pl-0">
                <b className="block font-mono text-3xl font-semibold">{v ?? '—'}</b>
                <span className="mt-1 block text-xs text-ink-soft">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex h-14 items-center gap-3 border-2 border-ink bg-paper-hi px-4 transition-shadow focus-within:shadow-hard">
          <Icon name="search" className="h-5 w-5 text-ink-soft" />
          <input ref={searchRef} value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหาระบบงาน คำอธิบาย หรือแท็ก…"
            className="h-full min-w-0 flex-1 bg-transparent font-medium outline-none placeholder:text-[#9C9585]" />
          {q && <button onClick={() => setQ('')} className="text-ink-soft hover:text-ink"><Icon name="x" /></button>}
          <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-[11px] text-ink-soft md:block">/</kbd>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <div className="inline-flex border-[1.5px] border-ink bg-paper-hi">
            {[['ALL', 'ทั้งหมด'], ['CORE', 'ระบบหลัก'], ['EXTERNAL', 'ภายนอก']].map(([v, label]) => (
              <button key={v} onClick={() => { setType(v); setPage(1); }}
                className={`border-r-[1.5px] border-ink px-4 py-2 text-[13px] font-semibold last:border-r-0 ${type === v ? 'bg-ink text-paper' : ''}`}>{label}</button>
            ))}
          </div>
          <div className="flex flex-1 flex-wrap gap-2">
            {meta?.tags?.map(t => (
              <button key={t.name} onClick={() => { setTag(tag === t.name ? null : t.name); setPage(1); }}
                className={`border px-3 py-1.5 text-xs ${tag === t.name ? 'border-accent bg-accent-soft font-semibold text-accent' : 'border-line text-ink-soft hover:border-ink hover:text-ink'}`}>
                {t.name} <span className="font-mono text-[10px] opacity-70">{t.n}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-baseline gap-2 border-b-2 border-ink pb-2.5 text-sm text-ink-soft">
          แสดง <b className="font-mono text-[15px] text-ink">{data.items.length}</b> จาก <b className="font-mono text-[15px] text-ink">{data.total}</b> รายการ
          {dq && <>· คำค้น: <b className="text-ink">{dq}</b></>}
        </div>

        {loading && <p className="mt-10 animate-pulse text-center font-mono text-sm text-ink-soft">กำลังโหลดข้อมูล…</p>}

        {!loading && <Group title="ระบบงานหลัก" en="Internal Systems" items={core} open={open} toggle={toggle} dq={dq} />}
        {!loading && <Group title="ลิงก์จากภายนอก" en="External Services" items={ext} open={open} toggle={toggle} dq={dq} />}

        {!loading && data.items.length === 0 && (
          <div className="mx-auto mt-16 max-w-sm text-center text-ink-soft">
            <Icon name="search" className="mx-auto h-10 w-10 opacity-40" sw={1.2} />
            <h3 className="mt-4 font-serif text-xl font-semibold text-ink">ไม่พบรายการที่ตรงกับคำค้นหา</h3>
            <p className="mt-1.5 text-sm leading-6">ลองใช้คำสั้นลง หรือล้างตัวกรองทั้งหมด</p>
            <button onClick={() => { setQ(''); setType('ALL'); setTag(null); }} className="mt-4 border border-ink px-4 py-2 text-sm hover:bg-paper-lo">ล้างทั้งหมด</button>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3 font-mono text-sm">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="border border-ink px-3 py-1.5 disabled:opacity-30">← ก่อนหน้า</button>
            <span>หน้า {page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="border border-ink px-3 py-1.5 disabled:opacity-30">ถัดไป →</button>
          </div>
        )}
        <footer className="mt-20 flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink pt-3.5 font-mono text-[11px] text-ink-soft">
          <span>ทะเบียนระบบงาน · React + Express + Supabase</span>
          <span className="flex items-center gap-4">
            <Link to="/privacy" className="underline hover:text-ink">นโยบายความเป็นส่วนตัว (PDPA)</Link>
            <button onClick={() => window.dispatchEvent(new Event('consent:open'))} className="underline hover:text-ink">ตั้งค่าคุกกี้</button>
          </span>
        </footer>
      </div>

      <LiveChat />
    </div>
  );
}

function Group({ title, en, items, open, toggle, dq }) {
  if (!items.length) return null;
  return (
    <section className="mt-9">
      <div className="flex items-baseline gap-3 pb-2.5">
        <h2 className="font-serif text-2xl font-semibold">{title}</h2>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-soft">{en}</span>
        <span className="ml-auto font-mono text-xs text-ink-soft">{items.length} รายการ</span>
      </div>
      <ul className="border-b border-line">
        {items.map(it => <Row key={it.id} it={it} isOpen={open.has(it.id)} onToggle={() => toggle(it.id)} dq={dq} />)}
      </ul>
    </section>
  );
}

function Row({ it, isOpen, onToggle, dq }) {
  const maint = it.status === 'MAINTENANCE';
  return (
    <li className={`border-t border-line transition-colors ${isOpen ? 'bg-paper-hi' : 'hover:bg-paper-lo'}`}>
      <button onClick={onToggle} className="grid w-full grid-cols-[7rem_1fr] items-start gap-5 px-3 py-5 text-left md:grid-cols-[7rem_1fr_auto]">
        <div className="flex flex-col items-start gap-2">
          <span className="font-mono text-sm text-ink-soft">{it.code}</span>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10.5px] font-semibold ${it.type === 'CORE' ? 'bg-ink text-paper' : 'border-[1.5px] border-ink text-ink'}`}>
            <Icon name={it.type === 'CORE' ? 'building' : 'globe'} className="h-3 w-3" />
            {it.type === 'CORE' ? 'ระบบหลัก' : 'ลิงก์ภายนอก'}
          </span>
        </div>
        <div>
          <h3 className="font-serif text-xl font-semibold" dangerouslySetInnerHTML={{ __html: highlight(it.name, dq) }} />
          <p className={`mt-1 text-sm leading-6 text-ink-soft ${isOpen ? '' : 'clamp-1'}`} dangerouslySetInnerHTML={{ __html: highlight(it.description || 'ยังไม่มีคำอธิบาย', dq) }} />
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {it.tags.map(t => <span key={t} className="border border-line px-2 py-0.5 font-mono text-[11px] text-ink-soft" dangerouslySetInnerHTML={{ __html: highlight(t, dq) }} />)}
          </div>
        </div>
        <div className="hidden flex-col items-end gap-2 md:flex">
          <span className="font-mono text-[11px] text-ink-soft">เพิ่ม {fmtDate(it.createdAt)}</span>
          {maint
            ? <span className="flex items-center gap-2 text-xs font-semibold text-accent"><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />ปรับปรุงระบบ</span>
            : <span className="text-xs font-semibold text-[#3D6B3F]">พร้อมใช้งาน</span>}
          <Icon name="chevron" className={`h-4 w-4 text-ink-soft transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <div className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-6 px-3 pb-6 md:pl-[7.75rem]">
            <div className="flex flex-wrap gap-8">
              <div><p className="mb-1 text-[11px] text-ink-soft">ที่อยู่</p><p className="max-w-xs truncate font-mono text-xs">{it.url}</p></div>
              <div><p className="mb-1 text-[11px] text-ink-soft">เพิ่มเข้าทะเบียน</p><p className="text-sm font-medium">{fmtDate(it.createdAt)}</p></div>
              <div><p className="mb-1 text-[11px] text-ink-soft">รหัสระบบ</p><p className="font-mono text-xs">{it.code}</p></div>
            </div>
            {maint
              ? <span className="cursor-not-allowed border-2 border-accent px-5 py-3 text-sm font-semibold text-accent">ปิดปรับปรุงระบบชั่วคราว</span>
              : <a href={it.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border-2 border-ink bg-ink px-5 py-3 text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5 hover:shadow-hardAccent">
                เข้าใช้งาน <Icon name="upright" className="h-3.5 w-3.5" />
              </a>}
          </div>
        </div>
      </div>
    </li>
  );
}