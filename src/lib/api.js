import axios from 'axios';

// Access token เก็บในหน่วยความจำเท่านั้น (ไม่ลง localStorage → ลดความเสี่ยง XSS)
export const tokenStore = { access: null, user: null };

export const api = axios.create({ baseURL: '/api', withCredentials: true });

api.interceptors.request.use((cfg) => {
  if (tokenStore.access) cfg.headers.Authorization = `Bearer ${tokenStore.access}`;
  return cfg;
});

// refresh ครั้งเดียวแบบ shared — กันหลาย request พร้อมกันเรียก refresh ซ้ำ
let refreshPromise = null;
export function refreshSession() {
  refreshPromise = refreshPromise || api.post('/auth/refresh').catch((e) => { refreshPromise = null; throw e; });
  return refreshPromise;
}

api.interceptors.response.use(undefined, async (err) => {
  const { response, config } = err;
  if (response?.status === 401 && !config._retry && !config.url.includes('/auth/')) {
    config._retry = true;
    try {
      const { data } = await refreshSession();
      tokenStore.access = data.accessToken;
      tokenStore.user = data.user;
      config.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(config);
    } catch {
      tokenStore.access = null; tokenStore.user = null;
      window.dispatchEvent(new Event('auth:logout'));
    }
  }
  return Promise.reject(err);
});