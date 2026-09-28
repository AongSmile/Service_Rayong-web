import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PublicHome from './pages/PublicHome';
import AdminLogin from './pages/AdminLogin';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AdminLayout from './pages/admin/AdminLayout';
import SystemsManager from './pages/admin/SystemsManager';
import ChatInbox from './pages/admin/ChatInbox';
import PrivacyAdmin from './pages/admin/PrivacyAdmin';
import UsersAdmin from './pages/admin/UsersAdmin';
import CookieConsent from './components/CookieConsent';

const Loader = () => (
  <div className="flex min-h-screen items-center justify-center bg-ink-deep font-mono text-sm text-muted">กำลังตรวจสอบเซสชัน…</div>
);

function RequireAdmin({ children }) {
  const { user, booting } = useAuth();
  if (booting) return <Loader />;
  const allowed = user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN');
  return allowed ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route index element={<SystemsManager />} />
            <Route path="chat" element={<ChatInbox />} />
            <Route path="privacy" element={<PrivacyAdmin />} />
            <Route path="users" element={<UsersAdmin />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <CookieConsent />
      </AuthProvider>
    </BrowserRouter>
  );
}