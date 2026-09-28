import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await login(email, password); nav('/admin'); }
    catch (ex) { setErr(ex.response?.data?.error || 'เข้าสู่ระบบไม่สำเร็จ'); }
    finally { setBusy(false); }
  };

  const inp = 'w-full border border-ink-line bg-ink-deep px-3 py-2.5 text-sm outline-none focus:border-accent-dark';

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-deep px-6 text-[#F0EDE3]">
      <div className="w-full max-w-sm">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-accent-dark">Back Office · เข้าสู่ระบบ</p>
        <h1 className="font-serif text-3xl font-semibold">หลังบ้าน · ทะเบียนระบบงาน</h1>
        <p className="mt-2 text-sm leading-6 text-muted">สำหรับผู้ดูแลระบบเท่านั้น — ทุกการเข้าถึงต้องยืนยันตัวตนด้วย JWT</p>
        <form onSubmit={submit} className="mt-8 space-y-4 border border-ink-line bg-ink-panel p-6">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">อีเมล</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus className={inp} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">รหัสผ่าน</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className={inp} />
          </div>
          {err && <p className="border-l-2 border-accent-dark bg-accent-dark/10 px-3 py-2 text-xs text-accent-dark">{err}</p>}
          <button disabled={busy} className="w-full bg-accent-dark py-2.5 text-sm font-bold text-ink-deep hover:bg-[#F07C4F] disabled:opacity-50">
            {busy ? 'กำลังตรวจสอบ…' : 'เข้าสู่ระบบ'}
          </button>
        </form>
        <Link to="/" className="mt-4 inline-block text-xs text-muted hover:text-[#F0EDE3]">← กลับหน้าทะเบียน</Link>
      </div>
    </div>
  );
}