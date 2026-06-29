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

// Tries employee login first, then superadmin.
// This way a single login form works for all roles.
export async function login(payload: { employeeId: string; password: string }): Promise<LoginResponse> {
  if (!payload.employeeId || !payload.password) {
    throw new Error('Employee ID and password are required');
  }

  try {
    // Try employee/admin login first
    const response = await apiFetch<LoginResponse>('/employee/auth/login', {
      method: 'POST',
      body: payload,
    });
    
    // Store token and user data
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('userRole', response.user.role);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  } catch (error) {
    // If that fails, try superadmin login
    try {
      const response = await apiFetch<LoginResponse>('/superadmin/auth/login', {
        method: 'POST',
        body: payload,
      });
      
      // Store token and user data
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('userRole', response.user.role);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (superAdminError) {
      throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export async function logout(role: string): Promise<void> {
  if (!role) {
    throw new Error('Role is required for logout');
  }

  try {
    const endpoint = role === 'super_admin' ? '/superadmin/auth/logout' : '/employee/auth/logout';
    await apiFetch(endpoint, { method: 'POST' });
  } catch (error) {
    // Ignore logout errors
  } finally {
    // Always clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
  }
}

export async function getProfile(role: string) {
  if (!role) {
    throw new Error('Role is required to fetch profile');
  }

  try {
    const endpoint = role === 'super_admin' ? '/superadmin/auth/profile' : '/employee/auth/profile';
    return await apiFetch<any>(endpoint);
  } catch (error) {
    throw new Error(`Failed to fetch profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}