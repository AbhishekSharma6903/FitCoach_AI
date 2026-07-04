import axios from "axios";
import { API_BASE } from "./constants";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

/**
 * Call this once at app startup (in a client component) to wire up the
 * Clerk session token so every api.* call sends Authorization: Bearer <token>.
 *
 * In dev mode (NEXT_PUBLIC_DEV_MODE=true) this is a no-op — the interceptor
 * sends a dummy token and the backend's dev bypass accepts it.
 */
let _getToken: (() => Promise<string | null>) | null = null;

export function setApiTokenGetter(fn: () => Promise<string | null>) {
  _getToken = fn;
}

api.interceptors.request.use(async (config) => {
  if (DEV_MODE) {
    // Backend dev bypass: any non-empty token works when CLERK_JWKS_URL is unset
    config.headers.Authorization = "Bearer dev-token";
    return config;
  }
  if (_getToken) {
    const token = await _getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
