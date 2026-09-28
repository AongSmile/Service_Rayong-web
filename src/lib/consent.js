import { api } from './api';

export const POLICY_VERSION = '1.0'; // ต้องตรงกับ backend (.env: POLICY_VERSION) — แก้พร้อมกันเสมอเมื่อปรับนโยบาย
const KEY = 'pdpa.consent';

export function getConsent() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    if (c.version !== POLICY_VERSION) return null; // นโยบายเวอร์ชันใหม่ → ถามยินยอมใหม่
    return c;
  } catch { return null; }
}

export function hasFunctional() { return !!getConsent()?.functional; }

function visitorHeader() {
  try {
    const s = JSON.parse(localStorage.getItem('chat.session') || 'null');
    return s?.visitorToken ? { 'x-visitor-token': s.visitorToken } : {};
  } catch { return {}; }
}

export function saveConsent({ functional }) {
  const c = { necessary: true, functional: !!functional, version: POLICY_VERSION, ts: new Date().toISOString() };
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {}
  api.post('/consent', { functional: c.functional }, { headers: visitorHeader() }).catch(() => {});
  window.dispatchEvent(new CustomEvent('consent:changed', { detail: c }));
  return c;
}

export function withdrawCookies() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem('chat.session'); // ถอนยินยอม = ลบข้อมูลที่เก็บด้วย
    localStorage.removeItem('chat.name');
  } catch {}
  api.post('/consent/withdraw', {}, { headers: visitorHeader() }).catch(() => {});
  window.dispatchEvent(new Event('consent:changed'));
}