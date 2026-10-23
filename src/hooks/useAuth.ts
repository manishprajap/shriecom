/**
 * useAuth.ts
 * Path: src/hooks/useAuth.ts
 *
 * Smart storage — koi extra package install nahi karna:
 *  - Android/iOS native app  →  window.Capacitor.Plugins.Preferences (built-in)
 *  - Web browser             →  localStorage (fallback)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role_id: number;
  role: 'admin' | 'customer' | 'delivery_boy';
  initials: string;
  zone?: string;
  vehicle?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Keys
// ─────────────────────────────────────────────────────────────────────────────

const KEYS = {
  token:  'auth_token',
  user:   'auth_user',
  roleId: 'auth_role_id',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Platform check — Capacitor native hai ya web?
// ─────────────────────────────────────────────────────────────────────────────

const getNativePreferences = (): any | null => {
  try {
    const cap = (window as any)?.Capacitor;
    if (cap?.isNativePlatform?.() && cap?.Plugins?.Preferences) {
      return cap.Plugins.Preferences;
    }
  } catch {
    // ignore
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Storage abstraction
// ─────────────────────────────────────────────────────────────────────────────

const storage = {
  async set(key: string, value: string): Promise<void> {
    const prefs = getNativePreferences();
    if (prefs) {
      await prefs.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  },

  async get(key: string): Promise<string | null> {
    const prefs = getNativePreferences();
    if (prefs) {
      const result = await prefs.get({ key });
      return result?.value ?? null;
    }
    return localStorage.getItem(key);
  },

  async remove(key: string): Promise<void> {
    const prefs = getNativePreferences();
    if (prefs) {
      await prefs.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Login ke baad call karo
 * token + full user object secure storage mein save hoga
 */
export const saveAuth = async (token: string, user: AuthUser): Promise<void> => {
  await storage.set(KEYS.token,  token);
  await storage.set(KEYS.user,   JSON.stringify(user));
  await storage.set(KEYS.roleId, String(user?.role_id ?? 2));
};

/**
 * API calls mein use karo
 * Returns: "sfood_xxx..." token string ya null
 */
export const getToken = async (): Promise<string | null> => {
  return storage.get(KEYS.token);
};

/**
 * User info chahiye kahi bhi — naam, role, email, etc.
 * Returns: AuthUser object ya null
 */
export const getUser = async (): Promise<AuthUser | null> => {
  const value = await storage.get(KEYS.user);
  if (!value) return null;
  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    return null;
  }
};

/**
 * Role ID lo — 1=admin, 2=customer, 3=delivery_boy
 */
export const getRoleId = async (): Promise<number> => {
  const value = await storage.get(KEYS.roleId);
  return value ? parseInt(value, 10) : 2;
};

/**
 * Login check karo — protected routes ke liye
 */
export const isLoggedIn = async (): Promise<boolean> => {
  const token = await getToken();
  return Boolean(token);
};

/**
 * Logout — sab kuch clear karo (server aur local dono)
 * Note: server ka /api/logout call apiClient se alag karo
 */
export const clearAuth = async (): Promise<void> => {
  await storage.remove(KEYS.token);
  await storage.remove(KEYS.user);
  await storage.remove(KEYS.roleId);
};