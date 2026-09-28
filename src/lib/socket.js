import { io } from 'socket.io-client';

let socket = null;
let identity = null;

// singleton: ถูกเรียกซ้ำด้วยตัวตนเดิมจะคืน connection เดิม (หน้าหลัก/หน้าแชทใช้ร่วมกันได้)
export function getSocket(auth = {}) {
  const id = auth.adminToken ? `admin` : auth.visitorToken ? `visitor:${auth.visitorToken}` : null;
  if (socket && id === identity) return socket;
  if (socket) socket.disconnect();
  identity = id;
  socket = io('/', { withCredentials: true, auth: { adminToken: auth.adminToken, visitorToken: auth.visitorToken } });
  return socket;
}

export function disconnectSocket() { socket?.disconnect(); socket = null; identity = null; }