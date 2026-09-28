import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getSocket, disconnectSocket } from '../../lib/socket';
import { tokenStore } from '../../lib/api';
import Icon from '../../components/Icon';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const can = (p) => user?.role === 'SUPERADMIN' || user?.perms?.includes(p);
  const nav = useNavigate();
  const location = useLocation();
  const [chatUnread, setChatUnread] = useState(0);

  useEffect(() => {
    const socket = getSocket({ adminToken: tokenStore.access });
    const onSessionUpdate = ({ unreadDelta }) => {
      if (!location.pathname.startsWith('/admin/chat')) setChatUnread(u => u + (unreadDelta || 0));
    };
    socket.on('chat:session-update', onSessionUpdate);
    return () => socket.off('chat:session-update', onSessionUpdate);
  }, [location.pathname]);

  const doLogout = async () => { await logout(); nav('/admin/login'); };
  const item = ({ isActive }) => `flex items-center gap-2.5 px-4 py-2.5 text-sm ${isActive ? 'border-l-2 border-accent-dark bg-accent-dark/15 text-accent-dark' : 'text-muted hover:text-[#F0EDE3]'}`;

  return (
    <div className="flex min-h-screen bg-ink-deep text-[#F0EDE3]">
      <aside className="flex w-60 flex-shrink-0 flex-col border-r border-ink-line">
        <div className="border-b border-ink-line px-5 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent-dark">Back Office</p>
          <p className="mt-1 font-serif text-lg font-semibold">ทะเบียนระบบงาน</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          <NavLink to="/admin" end className={item}><Icon name="list" className="h-4 w-4" />จัดการทะเบียนระบบ</NavLink>
          {can('chat.agent') && <NavLink to="/admin/chat" className={item}>…กล่องข้อความแชท…</NavLink>}
          {can('privacy.manage') && <NavLink to="/admin/privacy" className={item}>…PDPA · ข้อมูลส่วนบุคคล…</NavLink>}
          {can('users.manage') && <NavLink to="/admin/users" className={item}><Icon name="users" className="h-4 w-4" />จัดการบัญชีและสิทธิ์</NavLink>}
        </nav>
        <div className="border-t border-ink-line p-4">
          <p className="text-sm font-semibold">{user?.name}</p>
          <p className="truncate font-mono text-[10.5px] text-muted">{user?.email}</p>
          {user?.role === 'SUPERADMIN' && (
            <span className="mt-1 inline-block border border-accent-dark px-1.5 py-0.5 font-mono text-[9px] font-bold text-accent-dark">SUPERADMIN</span>
          )}
          <div className="mt-3 flex gap-2">
            <a href="/" target="_blank" rel="noreferrer" className="flex-1 border border-ink-line py-1.5 text-center text-xs text-muted hover:text-[#F0EDE3]">หน้าบ้าน</a>
            <button onClick={doLogout} className="flex flex-1 items-center justify-center gap-1.5 border border-ink-line py-1.5 text-xs text-muted hover:border-accent-dark hover:text-accent-dark">
              <Icon name="logout" className="h-3.5 w-3.5" />ออก
            </button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1"><Outlet context={{ resetChatUnread: () => setChatUnread(0) }} /></main>
    </div>
  );
}