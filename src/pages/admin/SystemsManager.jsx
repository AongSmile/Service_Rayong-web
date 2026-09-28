import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import Icon from '../../components/Icon';

const EMPTY = { type: 'CORE', name: '', url: '', description: '', tags: '', status: 'ACTIVE' };
const inp = 'w-full border border-ink-line bg-ink-deep px-3 py-2.5 text-sm outline-none focus:border-accent-dark';

export default function SystemsManager() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState('');

  const load = () => api.get('/systems', { params: { pageSize: 200 } }).then(r => setItems(r.data.items)).catch(() => {});
  useEffect(() => { load(); }, []);

  const notify = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 2600); };
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const filtered = items.filter(i => !q.trim() || [i.name, i.code, i.description, ...(i.tags || [])].join(' ').toLowerCase().includes(q.trim().toLowerCase()));

  const startEdit = (it) => {
    setEditing(it.id);
    setForm({ type: it.type, name: it.name, url: it.url, description: it.description || '', tags: (it.tags || []).join(', '), status: it.status });
    setShowForm(true); setErr('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const startCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true); setErr(''); };

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    const payload = { type: form.type, name: form.name, url: form.url.trim(), description: form.description, status: form.status, tags: form.tags.split(',').map(s => s.trim()).filter(Boolean) };
    if (payload.url && !/^https?:\/\//i.test(payload.url)) payload.url = 'https://' + payload.url;
    try {
      if (editing) { await api.patch(`/systems/${editing}`, payload); notify('บันทึกการแก้ไขแล้ว'); }
      else { const r = await api.post('/systems', payload); notify(`เพิ่มรายการใหม่แล้ว · ${r.data.item.code}`); }
      setShowForm(false); setEditing(null); setForm(EMPTY); load();
    } catch (ex) { setErr(ex.response?.data?.error || 'บันทึกไม่สำเร็จ'); }
    finally { setBusy(false); }
  };

  const remove = async (it) => { await api.delete(`/systems/${it.id}`).catch(() => {}); notify(`ลบ «${it.name}» แล้ว`); load(); };
  const reorder = async (it, dir) => { await api.patch(`/systems/${it.id}/reorder`, { dir }).catch(() => {}); load(); };

  const exportJson = async () => {
    try {
      const r = await api.get('/systems/export', { responseType: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(r.data);
      a.download = `registry-${new Date().toISOString().slice(0, 10)}.json`;
      a.click(); URL.revokeObjectURL(a.href);
    } catch { notify('ส่งออกไม่สำเร็จ'); }
  };

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent-dark">Registry Manager</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold">จัดการทะเบียนระบบงาน</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={exportJson} className="flex items-center gap-2 border border-ink-line px-4 py-2 text-sm text-muted hover:text-[#F0EDE3]"><Icon name="download" className="h-4 w-4" />ส่งออก</button>
          <button onClick={startCreate} className="flex items-center gap-2 bg-accent-dark px-4 py-2 text-sm font-bold text-ink-deep hover:bg-[#F07C4F]"><Icon name="plus" className="h-4 w-4" />เพิ่มระบบงาน</button>
        </div>
      </div>

      {flash && <p className="mt-4 border-l-2 border-accent-dark bg-accent-dark/10 px-3 py-2 text-sm">{flash}</p>}

      {showForm && (
        <form onSubmit={submit} className="mt-6 space-y-4 border border-ink-line bg-ink-panel p-6">
          <h2 className="font-serif text-lg font-semibold">{editing ? 'แก้ไขรายการ' : 'เพิ่มระบบงานใหม่'}</h2>
          <div className="grid grid-cols-2 gap-3">
            {[['CORE', 'ระบบงานหลัก', 'เว็บแอปภายในองค์กร (SYS-xxx)'], ['EXTERNAL', 'ลิงก์จากภายนอก', 'เว็บไซต์หน่วยงานอื่น (EXT-xxx)']].map(([v, t, d]) => (
              <label key={v} className="cursor-pointer">
                <input type="radio" name="ftype" checked={form.type === v} onChange={() => setForm(f => ({ ...f, type: v }))} className="peer sr-only" />
                <div className="h-full border border-ink-line p-3 peer-checked:border-accent-dark peer-checked:bg-accent-dark/10">
                  <p className="text-sm font-semibold">{t}</p><p className="mt-0.5 text-[11px] text-muted">{d}</p>
                </div>
              </label>
            ))}
          </div>
          <div><label className="mb-1.5 block text-xs font-semibold text-muted">ชื่อระบบ <i className="not-italic text-accent-dark">*</i></label>
            <input value={form.name} onChange={set('name')} required className={inp} placeholder="เช่น ระบบลางานออนไลน์" /></div>
          <div><label className="mb-1.5 block text-xs font-semibold text-muted">ที่อยู่ (URL) <i className="not-italic text-accent-dark">*</i></label>
            <input value={form.url} onChange={set('url')} required inputMode="url" className={`${inp} font-mono text-xs`} placeholder="https://…" /></div>
          <div><label className="mb-1.5 block text-xs font-semibold text-muted">คำอธิบาย</label>
            <textarea value={form.description} onChange={set('description')} rows={3} className={`${inp} leading-6`} /></div>
          <div><label className="mb-1.5 block text-xs font-semibold text-muted">แท็ก — คั่นด้วย ,</label>
            <input value={form.tags} onChange={set('tags')} className={`${inp} font-mono text-xs`} placeholder="เช่น เอกสาร, บุคคล" /></div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">สถานะ</label>
            <div className="inline-flex border border-ink-line">
              {[['ACTIVE', 'พร้อมใช้งาน'], ['MAINTENANCE', 'ปรับปรุงระบบ']].map(([v, t]) => (
                <button type="button" key={v} onClick={() => setForm(f => ({ ...f, status: v }))}
                  className={`px-4 py-2 text-[13px] font-semibold ${form.status === v ? 'bg-[#F0EDE3] text-ink-deep' : 'text-muted'}`}>{t}</button>
              ))}
            </div>
          </div>
          {err && <p className="border-l-2 border-accent-dark bg-accent-dark/10 px-3 py-2 text-xs text-accent-dark">{err}</p>}
          <div className="flex gap-2 pt-1">
            <button disabled={busy} className="bg-accent-dark px-6 py-2.5 text-sm font-bold text-ink-deep hover:bg-[#F07C4F] disabled:opacity-50">{busy ? 'กำลังบันทึก…' : 'บันทึก'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="border border-ink-line px-6 py-2.5 text-sm text-muted hover:text-[#F0EDE3]">ยกเลิก</button>
          </div>
        </form>
      )}

      <div className="mt-6">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="กรองรายการในหลังบ้าน…"
          className="w-full border border-ink-line bg-ink-panel px-4 py-2.5 text-sm outline-none focus:border-accent-dark" />
      </div>

      <AdminGroup title="ระบบงานหลัก" arr={filtered.filter(i => i.type === 'CORE')} onEdit={startEdit} onDel={remove} onReorder={reorder} />
      <AdminGroup title="ลิงก์จากภายนอก" arr={filtered.filter(i => i.type === 'EXTERNAL')} onEdit={startEdit} onDel={remove} onReorder={reorder} />
    </div>
  );
}

function AdminGroup({ title, arr, onEdit, onDel, onReorder }) {
  return (
    <section className="mt-8">
      <h2 className="mb-1 font-serif text-base font-semibold text-muted">{title} · {arr.length}</h2>
      {arr.map((it, i) => (
        <div key={it.id} className="flex items-center gap-3 border-t border-ink-line py-3">
          <span className="w-5 font-mono text-[11px] text-[#6B6555]">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{it.name}</p>
            <p className="truncate font-mono text-[10.5px] text-muted">{it.code} · {it.status === 'MAINTENANCE' ? 'ปรับปรุงระบบ' : 'พร้อมใช้งาน'} · {(it.tags || []).join(', ') || 'ไม่มีแท็ก'}</p>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => onReorder(it, 'up')} disabled={i === 0} className="border border-ink-line p-1.5 text-muted hover:text-[#F0EDE3] disabled:opacity-25"><Icon name="up" className="h-3.5 w-3.5" /></button>
            <button onClick={() => onReorder(it, 'down')} disabled={i === arr.length - 1} className="border border-ink-line p-1.5 text-muted hover:text-[#F0EDE3] disabled:opacity-25"><Icon name="down" className="h-3.5 w-3.5" /></button>
            <button onClick={() => onEdit(it)} className="border border-ink-line p-1.5 text-muted hover:text-[#F0EDE3]"><Icon name="pen" className="h-3.5 w-3.5" /></button>
            <DelBtn onClick={() => onDel(it)} />
          </div>
        </div>
      ))}
      {arr.length === 0 && <p className="border-t border-ink-line py-4 text-xs text-[#6B6555]">ไม่มีรายการ</p>}
    </section>
  );
}

function DelBtn({ onClick }) {
  const [armed, setArmed] = useState(false);
  const press = () => {
    if (armed) { onClick(); return; }
    setArmed(true);
    setTimeout(() => setArmed(false), 2500);
  };
  return (
    <button onClick={press} title="ลบ (กดซ้ำเพื่อยืนยัน)"
      className={`border p-1.5 ${armed ? 'border-accent-dark bg-accent-dark text-ink-deep' : 'border-ink-line text-muted hover:text-[#F0EDE3]'}`}>
      <Icon name="trash" className="h-3.5 w-3.5" />
    </button>
  );
}