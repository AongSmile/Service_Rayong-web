import { createContext, useContext, useEffect, useState } from 'react';
import { api, refreshSession, tokenStore } from '../lib/api';
import { disconnectSocket } from '../lib/socket';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    refreshSession()
      .then(({ data }) => { tokenStore.access = data.accessToken; tokenStore.user = data.user; setUser(data.user); })
      .catch(() => {})
      .finally(() => setBooting(false));
    const onLogout = () => setUser(null);
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    tokenStore.access = data.accessToken;
    tokenStore.user = data.user;
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    tokenStore.access = null; tokenStore.user = null;
    disconnectSocket();
    setUser(null);
  };

  return <Ctx.Provider value={{ user, booting, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);