const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api';

export async function apiFetch<T>(
  endpoint: string,
  options: Omit<RequestInit, 'body'> & { body?: any } = {}
): Promise<T> {
  const { body, ...rest } = options;

  // Read token from localStorage (set on login)
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...rest,
    credentials: 'include', // also sends httpOnly cookie as backup
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...rest.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    // On 401: clear storage but DON'T redirect here.
    // Let the calling page/component handle redirect so we avoid loops.
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('user');
    }
    throw new Error(data.message || 'Request failed');
  }

  return data;
}