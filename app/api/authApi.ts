import { apiFetch } from './apiClient';

export interface LoginResponse {
  success: boolean;
  token: string;
  redirectTo: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    employeeId: string;
    department: string;
    phone: string;
    joinDate: string;
  };
}

// ── Login ─────────────────────────────────────────────────────────────────────
// Single login for all roles.
// Tries /employee/auth/login first (covers employee + admin).
// If that returns 401 (wrong role), falls back to /superadmin/auth/login.
export async function login(payload: {
  employeeId: string;
  password: string;
}): Promise<LoginResponse> {
  if (!payload.employeeId || !payload.password) {
    throw new Error('Employee ID and password are required');
  }

  let lastError: Error | null = null;

  try {
    const response = await apiFetch<LoginResponse>('/employee/auth/login', {
      method: 'POST',
      body: payload,
    });
    storeSession(response);
    return response;
  } catch (err) {
    lastError = err instanceof Error ? err : new Error('Login failed');
  }

  try {
    const response = await apiFetch<LoginResponse>('/superadmin/auth/login', {
      method: 'POST',
      body: payload,
    });
    storeSession(response);
    return response;
  } catch {
    throw lastError ?? new Error('Invalid employee ID or password');
  }
}

function storeSession(response: LoginResponse) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', response.token);
  localStorage.setItem('userRole', response.user.role);
  localStorage.setItem('userDepartment', response.user.department);
  localStorage.setItem('userName', response.user.name);
  localStorage.setItem('user', JSON.stringify(response.user));
  localStorage.setItem('userHomeRoute', response.redirectTo); // single source of truth for redirects
}

// ── Logout ────────────────────────────────────────────────────────────────────
export async function logout(role?: string): Promise<void> {
  const resolvedRole = role || (typeof window !== 'undefined' ? localStorage.getItem('userRole') ?? '' : '');
  const endpoint = resolvedRole === 'super_admin'
    ? '/superadmin/auth/logout'
    : '/employee/auth/logout';

  try {
    await apiFetch(endpoint, { method: 'POST' });
  } catch {
    // Ignore server-side logout errors — always clear local state
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userDepartment');
      localStorage.removeItem('userName');
      localStorage.removeItem('user');
      localStorage.removeItem('userHomeRoute');
    }
  }
}

// ── Get Profile ───────────────────────────────────────────────────────────────
export async function getProfile(role?: string): Promise<any> {
  const resolvedRole = role || (typeof window !== 'undefined' ? localStorage.getItem('userRole') ?? '' : '');
  const endpoint = resolvedRole === 'super_admin'
    ? '/superadmin/auth/profile'
    : '/employee/auth/profile';

  return apiFetch<any>(endpoint);
}