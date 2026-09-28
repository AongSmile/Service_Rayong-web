import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getConsent, saveConsent } from '../lib/consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(() => getConsent() === null);
  const [detail, setDetail] = useState(false);
  const [functional, setFunctional] = useState(true);

  useEffect(() => {
    const open = () => { setDetail(true); setVisible(true); };
    const changed = () => setVisible(getConsent() === null);
    window.addEventListener('consent:open', open);
    window.addEventListener('consent:changed', changed);
    return () => { window.removeEventListener('consent:open', open); window.removeEventListener('consent:changed', changed); };
  }, []);

  const decide = (fn) => { saveConsent({ functional: fn }); setVisible(false); };
  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-40 w-[370px] max-w-[calc(100vw-3rem)] border-2 border-ink bg-paper-hi shadow-hard">
      <div className="border-b-2 border-ink bg-ink px-4 py-2.5 text-paper">
        <p className="font-serif text-sm font-semibold">คุกกี้และความเป็นส่วนตัว · PDPA</p>
      </div>
      <div className="px-4 py-4 text-[13px] leading-6 text-ink-soft">
        เว็บไซต์ใช้คุกกี้<b className="text-ink">ที่จำเป็น</b>ต่อการทำงานและความปลอดภัยเสมอ
        และขออนุญาตเก็บข้อมูล<b className="text-ink">การใช้งาน</b>ในเบราว์เซอร์ของคุณ (เช่น จดจำเซสชันแชท)
        คุณเลือกที่จะไม่ยินยอมได้ และเปลี่ยนใจได้ทุกเมื่อที่{' '}
        <Link to="/privacy" className="font-semibold text-accent underline">นโยบายความเป็นส่วนตัว</Link>
        {detail && (
          <div className="mt-3 space-y-3 border-t border-line pt-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-ink">คุกกี้ที่จำเป็น</p>
                <p className="text-[11.5px] leading-5">การทำงานของระบบและความปลอดภัย — จำเป็นต้องเปิดเสมอ</p>
              </div>
              <span className="mt-0.5 shrink-0 border border-line px-2 py-0.5 font-mono text-[10px] text-ink-soft">บังคับ</span>
            </div>
            <label className="flex cursor-pointer items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-ink">คุกกี้การใช้งาน</p>
                <p className="text-[11.5px] leading-5">จดจำห้องแชทและชื่อของคุณไว้เมื่อกลับเข้ามาใหม่</p>
              </div>
              <input type="checkbox" checked={functional} onChange={e => setFunctional(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-[#B5401F]" />
            </label>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-line p-3">
        {detail ? (
          <button onClick={() => decide(functional)} className="border-2 border-ink bg-ink px-3.5 py-2 text-xs font-semibold text-paper">บันทึกการตั้งค่า</button>
        ) : (
          <button onClick={() => setDetail(true)} className="border border-ink px-3.5 py-2 text-xs text-ink-soft hover:text-ink">ตั้งค่า</button>
        )}
        <button onClick={() => decide(false)} className="flex-1 border-2 border-ink px-3.5 py-2 text-xs font-semibold text-ink hover:bg-paper-lo">เฉพาะที่จำเป็น</button>
        <button onClick={() => decide(true)} className="flex-1 border-2 border-ink bg-accent px-3.5 py-2 text-xs font-bold text-paper hover:bg-accent">ยอมรับทั้งหมด</button>
      </div>
    </div>
  );
}