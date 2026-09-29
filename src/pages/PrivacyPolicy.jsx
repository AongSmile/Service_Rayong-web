import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { getConsent, withdrawCookies } from '../lib/consent';

const DATA_TABLE = [
  ['ชื่อที่คุณกรอกในแชท', 'ใช้เรียกตอบในการสนทนา', '90 วัน หรือจนกว่าคุณจะขอลบ'],
  ['ข้อความในการแชท', 'ให้บริการตอบคำถามและติดตามงาน', '90 วัน (ลบอัตโนมัติ)'],
  ['ข้อมูลทางเทคนิค (IP แบบเข้ารหัส, ชนิดเบราว์เซอร์)', 'พิสูจน์การยินยอมและความปลอดภัย — เก็บเป็นแบบ hash ไม่สามารถย้อนรู้ IP จริงได้', '1 ปี'],
  ['ชื่อและอีเมลผู้ดูแลระบบ (หลังบ้าน)', 'ยืนยันตัวตนเข้าใช้งาน', 'ระหว่างเป็นผู้ใช้งาน'],
];

const RIGHTS = [
  'สิทธิ์เข้าถึงข้อมูลและขอสำเนา (ดาวน์โหลดได้ทันทีด้านล่าง)',
  'สิทธิ์ขอลบหรือทำลายข้อมูลส่วนบุคคล',
  'สิทธิ์ถอนความยินยอมได้ตลอดเวลา',
  'สิทธิ์คัดค้านการเก็บรวบรวมและขอระงับการใช้ข้อมูล',
  'สิทธิ์แก้ไขให้ข้อมูลเป็นปัจจุบัน',
];

export default function PrivacyPolicy() {
  return (
    <div className="relative min-h-screen">
      <div className="paper-noise" />
      <div className="relative z-10 mx-auto max-w-3xl px-6 pb-24">
        <header className="flex items-center justify-between border-b-2 border-ink py-4 text-sm">
          <Link to="/" className="flex items-center gap-2 font-semibold"><span className="h-2.5 w-2.5 bg-accent" />ศูนย์รวมระบบและบริการองค์กร</Link>
          <span className="font-mono text-xs text-ink-soft">PDPA · Policy v1.0</span>
        </header>

        <div className="pt-12">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft before:mr-3 before:inline-block before:h-0.5 before:w-8 before:bg-accent before:align-middle before:content-['']">Privacy Notice</p>
          <h1 className="font-serif text-4xl font-bold md:text-5xl">นโยบายความเป็นส่วนตัว</h1>
          <p className="mt-4 leading-7 text-ink-soft">เราเก็บข้อมูลส่วนบุคคลให้น้อยที่สุดเท่าที่จำเป็นต่อการให้บริการ ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) — หน้านี้อธิบายว่าเก็บอะไร เพื่ออะไร นานแค่ไหน และคุณใช้สิทธิ์ของตนเองได้อย่างไร</p>
        </div>

        <Section n="1" title="ข้อมูลส่วนบุคคลที่เราเก็บ">
          <div className="overflow-x-auto border border-line">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-line bg-paper-lo text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-3 py-2.5">ข้อมูล</th><th className="px-3 py-2.5">วัตถุประสงค์</th><th className="px-3 py-2.5">ระยะเวลาเก็บ</th>
              </tr></thead>
              <tbody>{DATA_TABLE.map(([d, p, r]) => (
                <tr key={d} className="border-b border-line last:border-b-0">
                  <td className="px-3 py-3 font-medium">{d}</td><td className="px-3 py-3 text-ink-soft">{p}</td><td className="px-3 py-3 text-ink-soft">{r}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <p className="mt-3 text-[13px] leading-6 text-ink-soft">เราไม่ใช้คุกกี้โฆษณาหรือส่งข้อมูลให้บุคคลที่สามเพื่อการตลาด และไม่มีระบบวิเคราะห์พฤติกรรมข้ามเว็บไซต์</p>
        </Section>

        <Section n="2" title="คุกกี้และพื้นที่จัดเก็บในเบราว์เซอร์">
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6 text-ink-soft">
            <li><b className="text-ink">ที่จำเป็น</b> — การทำงานพื้นฐานและความปลอดภัย เปิดใช้เสมอโดยไม่ต้องขออนุญาต</li>
            <li><b className="text-ink">การใช้งาน</b> — จดจำห้องแชทและชื่อของคุณ (ไม่ยินยอมก็แชทได้ เพียงแต่ระบบจะไม่จดจำเซสชันเมื่อปิดหน้าต่าง)</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => window.dispatchEvent(new Event('consent:open'))} className="border-2 border-ink bg-ink px-4 py-2 text-sm font-semibold text-paper">ตั้งค่าคุกกี้</button>
            {getConsent() && (
              <button onClick={() => { withdrawCookies(); alert('ถอนความยินยอมแล้ว ระบบลบข้อมูลที่จดจำไว้ในเบราว์เซอร์นี้เรียบร้อย'); }}
                className="border-2 border-accent px-4 py-2 text-sm font-semibold text-accent">ถอนความยินยอมคุกกี้</button>
            )}
          </div>
        </Section>

        <Section n="3" title="ระยะเวลารักษาข้อมูล">
          <p className="text-sm leading-7 text-ink-soft">ข้อมูลแชททั้งหมดถูก<b className="text-ink">ลบอัตโนมัติเมื่อครบ 90 วัน</b>นับจากการสนทนาครั้งสุดท้าย โดยคุณสามารถขอลบก่อนได้ทันทีด้วยตัวเองด้านล่าง ส่วนบันทึกหลักฐานการยินยอมเก็บไว้เพื่อแสดงการปฏิบัติตามกฎหมายไม่เกิน 1 ปี</p>
        </Section>

        <Section n="4" title="สิทธิ์ของเจ้าของข้อมูลส่วนบุคคล">
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6 text-ink-soft">{RIGHTS.map(r => <li key={r}>{r}</li>)}</ul>
        </Section>

        <Section n="5" title="เรียกดูหรือลบข้อมูลแชทของคุณทันที">
          <MyDataTools />
        </Section>

        <Section n="6" title="ส่งคำขอใช้สิทธิ์ถึงเจ้าหน้าที่คุ้มครองข้อมูล">
          <RequestForm />
        </Section>

        <Section n="7" title="ผู้ควบคุมข้อมูลส่วนบุคคลและเจ้าหน้าที่คุ้มครองข้อมูล (DPO)">
          <p className="text-sm leading-7 text-ink-soft">สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดระยอง · ศาลากลางจังหวัดระยอง ชั้น 1 · อีเมล DPO: tamrong.s@m-society.go.th · โทร: 038-694-075</p>
        </Section>

        <footer className="mt-16 border-t-2 border-ink pt-3.5 font-mono text-[11px] text-ink-soft">
          <Link to="/" className="hover:text-ink">← กลับหน้าทะเบียนระบบงาน</Link>
        </footer>
      </div>
    </div>
  );
}

function Section({ n, title, children }) {
  return (
    <section className="mt-10 border-t border-line pt-7">
      <h2 className="font-serif text-xl font-semibold"><span className="mr-2 font-mono text-sm text-accent">{n}.</span>{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function MyDataTools() {
  const [session, setSession] = useState(() => { try { return JSON.parse(localStorage.getItem('chat.session') || 'null'); } catch { return null; } });
  const [status, setStatus] = useState('');
  const [confirming, setConfirming] = useState(false);

  if (!session) return <p className="text-sm leading-7 text-ink-soft">ไม่พบเซสชันแชทที่จดจำไว้ในเบราว์เซอร์นี้ — หากคุณเคยแชท ข้อมูลจะถูกลบอัตโนมัติเมื่อครบ 90 วัน หรือใช้ฟอร์มคำขอในหัวข้อถัดไป</p>;

  const download = async () => {
    try {
      const { data } = await api.get('/privacy/my-data', { headers: { 'x-visitor-token': session.visitorToken } });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'my-chat-data.json'; a.click(); URL.revokeObjectURL(a.href);
      setStatus('✔ ดาวน์โหลดข้อมูลสำเร็จ');
    } catch (e) { setStatus('✖ ' + (e.response?.data?.error || 'ดึงข้อมูลไม่สำเร็จ')); }
  };

  const erase = async () => {
    try {
      await api.delete('/privacy/my-data', { headers: { 'x-visitor-token': session.visitorToken } });
      localStorage.removeItem('chat.session'); localStorage.removeItem('chat.name');
      setSession(null); setConfirming(false);
      setStatus('✔ ลบข้อมูลแชทจากเซิร์ฟเวอร์เรียบร้อยแล้ว');
    } catch (e) { setStatus('✖ ' + (e.response?.data?.error || 'ลบข้อมูลไม่สำเร็จ')); setConfirming(false); }
  };

  return (
    <div className="border border-line bg-paper-hi p-4">
      <p className="text-sm text-ink-soft">พบเซสชันแชทของคุณในเบราว์เซอร์นี้ — คุณสามารถดาวน์โหลดสำเนาทั้งหมด หรือสั่งลบจากเซิร์ฟเวอร์ได้ทันที</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={download} className="border-2 border-ink bg-ink px-4 py-2 text-sm font-semibold text-paper">ดาวน์โหลดข้อมูลของฉัน (JSON)</button>
        {confirming
          ? <button onClick={erase} className="border-2 border-accent bg-accent px-4 py-2 text-sm font-bold text-paper">ยืนยัน — ลบข้อมูลแชทของฉันถาวร</button>
          : <button onClick={() => setConfirming(true)} className="border-2 border-accent px-4 py-2 text-sm font-semibold text-accent">ลบข้อมูลแชทของฉัน</button>}
      </div>
      {status && <p className="mt-3 text-[13px] font-medium">{status}</p>}
    </div>
  );
}

function RequestForm() {
  const [form, setForm] = useState({ reqType: 'ACCESS', contact: '', detail: '' });
  const [refId, setRefId] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const { data } = await api.post('/privacy/request', form);
      setRefId(data.refId);
    } catch (ex) { setErr(ex.response?.data?.error || 'ส่งคำขอไม่สำเร็จ'); }
    finally { setBusy(false); }
  };

  if (refId) return (
    <div className="border border-line bg-paper-hi p-4 text-sm leading-7">
      ✔ ได้รับคำขอของคุณแล้ว — <b>เลขอ้างอิง: {refId}</b><br/>
      <span className="text-ink-soft">เจ้าหน้าที่จะติดต่อกลับที่อีเมลของคุณภายใน 30 วันตามที่กฎหมายกำหนด กรุณาเก็บเลขอ้างอิงนี้ไว้ตรวจสอบ</span>
    </div>
  );

  const inp = 'w-full border border-line bg-paper-hi px-3 py-2.5 text-sm outline-none focus:border-ink';
  return (
    <form onSubmit={submit} className="space-y-3 border border-line bg-paper-hi p-4">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-ink-soft">ประเภทคำขอ</label>
        <select value={form.reqType} onChange={e => setForm(f => ({ ...f, reqType: e.target.value }))} className={inp}>
          <option value="ACCESS">ขอเข้าถึง/รับสำเนาข้อมูลส่วนบุคคล</option>
          <option value="ERASURE">ขอลบหรือทำลายข้อมูลส่วนบุคคล</option>
          <option value="WITHDRAW">ถอนความยินยอมที่เคยให้ไว้</option>
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-ink-soft">อีเมลสำหรับติดต่อกลับ <i className="not-italic text-accent">*</i></label>
        <input type="email" required value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} className={inp} placeholder="you@example.org" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-ink-soft">รายละเอียดเพิ่มเติม</label>
        <textarea rows={3} value={form.detail} onChange={e => setForm(f => ({ ...f, detail: e.target.value }))} className={`${inp} leading-6`} placeholder="ระบุรายละเอียดคำขอ เช่น ข้อมูลใดบ้าง ช่วงเวลาที่ใช้บริการ ฯลฯ" />
      </div>
      {err && <p className="border-l-2 border-accent bg-accent-soft px-3 py-2 text-xs text-accent">{err}</p>}
      <button disabled={busy} className="border-2 border-ink bg-ink px-5 py-2.5 text-sm font-semibold text-paper disabled:opacity-50">{busy ? 'กำลังส่ง…' : 'ส่งคำขอใช้สิทธิ์'}</button>
    </form>
  );
}
