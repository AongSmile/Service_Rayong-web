import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import Icon from '../../components/Icon';

const ROLE_LABEL = { USER: 'ผู้ใช้งาน', ADMIN: 'ผู้ดูแลระบบ', SUPERADMIN: 'ผู้ดูแลสูงสุด' };
const inp = 'w-full border border-ink-line bg-ink-deep px-3 py-2.5 text-sm outline-none focus:border-accent-dark';

export default function UsersAdmin() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [err, setErr] = useState('');
  const [flash, setFlash] = useState('');
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  const notify = (m) => { setFlash(m); setTimeout(() => setFlash(''), 2800); };

  const load = () => {
    Promise.all([api.get('/users'), api.get('/users/perms-meta')])
      .then(([u, m]) => { setUsers(u.data.items); setMeta(m.data); setErr(''); })
      .catch(ex => setErr(ex.response?.data?.error || 'โหลดข้อมูลไม่สำเร็จ'));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditingId(null); setForm({ email: '', name: '', role: 'USER', password: '', permState: {} }); };
  const openEdit = (u) => {
    const permState = {};
    (u.blockedPerms || []).forEach(p => { permState[p] = 'blocked'; });
    (u.extraPerms || []).forEach(p => { permState[p] = 'extra'; });
    setEditingId(u.id); setForm({ email: u.email, name: u.name, role: u.role, password: '', permState });
  };

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const extraPerms = [], blockedPerms = [];
      Object.entries(form.permState || {}).forEach(([p, s]) => {
        if (s === 'extra') extraPerms.push(p);
        if (s === 'blocked') blockedPerms.push(p);
      });
      if (editingId) {
        const payload = { name: form.name, role: form.role, extraPerms, blockedPerms };
        if (form.password) payload.password = form.password;
        await api.patch(`/users/${editingId}`, payload);
        notify('บันทึกการแก้ไขบัญชีแล้ว');
      } else {
        await api.post('/users', { ...form, extraPerms, blockedPerms });
        notify(`สร้างบัญชี ${form.email} แล้ว`);
      }
      setForm(null); setEditingId(null); load();
    } catch (ex) { setErr(ex.response?.data?.error || 'บันทึกไม่สำเร็จ'); }
    finally { setBusy(false); }
  };

  const setStatus = async (u, status) => {
    try {
      await api.patch(`/users/${u.id}`, { status });
      notify(status === 'SUSPENDED' ? `ระงับบัญชี ${u.email} แล้ว` : `เปิดใช้งาน ${u.email} แล้ว`);
      load();
    } catch (ex) { setErr(ex.response?.data?.error || 'ทำรายการไม่สำเร็จ'); }
  };

  const remove = async (u) => {
    try { await api.delete(`/users/${u.id}`); notify(`ลบบัญชี ${u.email} แล้ว`); load(); }
    catch (ex) { setErr(ex.response?.data?.error || 'ลบไม่สำเร็จ'); }
  };

  const selfRow = users.find(u => u.id === me?.id);

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent-dark">Accounts & Permissions</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold">จัดการบัญชีผู้ใช้และสิทธิ์</h1>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-accent-dark px-4 py-2 text-sm font-bold text-ink-deep hover:bg-[#F07C4F]">
          <Icon name="plus" className="h-4 w-4" />สร้างบัญชีใหม่
        </button>
      </div>

      {flash && <p className="mt-4 border-l-2 border-accent-dark bg-accent-dark/10 px-3 py-2 text-sm">{flash}</p>}
      {err && <p className="mt-4 border-l-2 border-accent-dark bg-accent-dark/10 px-3 py-2 text-sm text-accent-dark">{err}</p>}

      {form && meta && (
        <form onSubmit={submit} className="mt-6 space-y-4 border border-ink-line bg-ink-panel p-6">
          <h2 className="font-serif text-lg font-semibold">{editingId ? `แก้ไขบัญชี · ${form.email}` : 'สร้างบัญชีใหม่'}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted">อีเมล <i className="not-italic text-accent-dark">*</i>{editingId && ' (แก้ไม่ได้)'}</label>
              <input value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                readOnly={!!editingId} required={!editingId}
                inputMode="email" className={`${inp} read-only:opacity-40`} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted">ชื่อ-นามสกุล <i className="not-italic text-accent-dark">*</i></label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className={inp} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted">บทบาท (Role)</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                disabled={editingId === me?.id} className={`${inp} disabled:opacity-40`}>
                {['USER', 'ADMIN', 'SUPERADMIN'].map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted">
                {editingId ? 'ตั้งรหัสผ่านใหม่ (เว้นว่าง = ไม่เปลี่ยน)' : 'รหัสผ่าน'}
                {!editingId && <i className="not-italic text-accent-dark"> *</i>}
              </label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required={!editingId} minLength={editingId ? undefined : 8} placeholder="••••••••" className={inp} />
            </div>
          </div>

          {meta && (
            <div>
              <p className="mb-2 text-xs font-semibold text-muted">สิทธิ์เฉพาะบุคคล — ค่าเริ่มต้นตามบทบาท {ROLE_LABEL[form.role]}</p>
              <div className="space-y-1.5 border border-ink-line p-3">
                {Object.entries(meta.permissions).map(([key, label]) => {
                  const forced = form.role === 'SUPERADMIN';
                  const def = (meta.roleDefaults[form.role] || []).includes(key);
                  const state = forced ? 'default' : (form.permState[key] || (def ? 'default' : 'none'));
                  return (
                    <div key={key} className="flex items-center gap-3 text-[13px]">
                      <span className="w-40 shrink-0 font-mono text-[11px] text-muted">{key}</span>
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      <span className={`w-14 shrink-0 text-center font-mono text-[10px] ${state === 'extra' ? 'text-accent-dark' :
                          state === 'blocked' ? 'text-accent-dark line-through' :
                            def ? 'text-[#7BC47F]' : 'text-[#6B6555]'}`}>
                        {forced ? 'ครบ' : state === 'extra' ? 'เพิ่ม' : state === 'blocked' ? 'ปิด' : (def ? '✔' : '—')}
                      </span>
                      <select disabled={forced} value={state}
                        onChange={e => setForm(f => ({ ...f, permState: { ...f.permState, [key]: e.target.value === 'default' ? undefined : e.target.value } }))}
                        className="w-36 shrink-0 border border-ink-line bg-ink-deep px-2 py-1 text-xs outline-none focus:border-accent-dark disabled:opacity-40">
                        <option value="default">ตาม role</option>
                        <option value="extra">เพิ่มเฉพาะบุคคล</option>
                        <option value="blocked">ปิดเฉพาะบุคคล</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {err && <p className="border-l-2 border-accent-dark bg-accent-dark/10 px-3 py-2 text-xs text-accent-dark">{err}</p>}
          <div className="flex gap-2">
            <button disabled={busy} className="bg-accent-dark px-6 py-2.5 text-sm font-bold text-ink-deep hover:bg-[#F07C4F] disabled:opacity-50">{busy ? 'กำลังบันทึก…' : 'บันทึก'}</button>
            <button type="button" onClick={() => { setForm(null); setEditingId(null); }} className="border border-ink-line px-6 py-2.5 text-sm text-muted hover:text-[#F0EDE3]">ยกเลิก</button>
          </div>
        </form>
      )}

      <div className="mt-6">
        {users.map(u => (
          <div key={u.id} className="flex flex-wrap items-center gap-3 border-t border-ink-line py-3.5">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-semibold">
                {u.name}
                <span className={`border px-1.5 py-0.5 font-mono text-[9px] ${u.role === 'SUPERADMIN' ? 'border-accent-dark text-accent-dark' : 'border-ink-line text-muted'}`}>{u.role}</span>
                {u.status === 'SUSPENDED' && <span className="border border-accent-dark px-1.5 py-0.5 font-mono text-[9px] text-accent-dark">ระงับ</span>}
                {u.id === me?.id && <span className="font-mono text-[9px] text-[#6B6555]">(คุณ)</span>}
              </p>
              <p className="truncate font-mono text-[10.5px] text-muted">
                {u.email} · สิทธิ์ {u.perms?.length ?? 0} รายการ{u.lastLoginAt ? ` · เข้าล่าสุด ${new Date(u.lastLoginAt).toLocaleDateString('th-TH')}` : ' · ยังไม่เคยเข้า'}
              </p>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => openEdit(u)} title="แก้ไข" className="border border-ink-line p-1.5 text-muted hover:text-[#F0EDE3]"><Icon name="pen" className="h-3.5 w-3.5" /></button>
              <button onClick={() => setStatus(u, u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                disabled={u.id === me?.id}
                title={u.status === 'ACTIVE' ? 'ระงับบัญชี' : 'เปิดใช้งาน'}
                className="border border-ink-line px-2 py-1.5 text-[11px] text-muted hover:border-accent-dark hover:text-accent-dark disabled:opacity-25">
                {u.status === 'ACTIVE' ? 'ระงับ' : 'เปิดใช้'}
              </button>
              <DelUser onClick={() => remove(u)} disabled={u.id === me?.id} />
            </div>
          </div>
        ))}
        {users.length === 0 && !err && <p className="border-t border-ink-line py-4 text-xs text-[#6B6555]">ยังไม่มีบัญชีในระบบ</p>}
      </div>
    </div>
  );
}

function DelUser({ onClick, disabled }) {
  const [armed, setArmed] = useState(false);
  const press = () => {
    if (disabled) return;
    if (armed) { onClick(); return; }
    setArmed(true);
    setTimeout(() => setArmed(false), 2500);
  };
  return (
    <button onClick={press} disabled={disabled} title="ลบ (กดซ้ำเพื่อยืนยัน)"
      className={`border p-1.5 ${armed ? 'border-accent-dark bg-accent-dark text-ink-deep' : 'border-ink-line text-muted hover:text-[#F0EDE3]'} disabled:opacity-25`}>
      <Icon name="trash" className="h-3.5 w-3.5" />
    </button>
  );
}