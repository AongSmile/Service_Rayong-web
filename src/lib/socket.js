import { io } from 'socket.io-client';

let socket = null;
let identity = null;

// ใน production ใช้ VITE_SOCKET_URL (โดเมน Railway) — ใน dev ว่าง = ใช้ proxy ของ Vite
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '/';

// singleton: ถูกเรียกซ้ำด้วยตัวตนเดิมจะคืน connection เดิม (หน้าหลัก/หน้าแชทใช้ร่วมกันได้)
export function getSocket(auth = {}) {
  const id = auth.adminToken ? `admin` : auth.visitorToken ? `visitor:${auth.visitorToken}` : null;
  if (socket && id === identity) return socket;
  if (socket) socket.disconnect();
  identity = id;
  socket = io(SOCKET_URL, { withCredentials: true, auth: { adminToken: auth.adminToken, visitorToken: auth.visitorToken } });
  return socket;
}

export function disconnectSocket() { socket?.disconnect(); socket = null; identity = null; }
