import axios from "axios";
import { API_BASE } from "./constants";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

/**
 * Call this once at app startup (in a client component) to wire up the
 * Clerk session token so every api.* call sends Authorization: Bearer <token>.
 *
 * Usage in a client component:
 *   const { getToken } = useAuth();
 *   useEffect(() => { setApiTokenGetter(getToken); }, [getToken]);
 */
let _getToken: (() => Promise<string | null>) | null = null;

export function setApiTokenGetter(fn: () => Promise<string | null>) {
  _getToken = fn;
}

api.interceptors.request.use(async (config) => {
  if (_getToken) {
    const token = await _getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
