"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

type AllowedRole = 'employee' | 'admin' | 'super_admin';

export function useAuthGuard(allowedRoles: AllowedRole[]) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole') as AllowedRole | null;

    if (!token || !role) {
      router.replace('/auth/login');
      return;
    }

    if (!allowedRoles.includes(role)) {
      const roleRedirects: Record<AllowedRole, string> = {
        employee:    '/dashboard/employeedashboard',
        admin:       '/dashboard/admindashboard',
        super_admin: '/dashboard/superadmindashboard',
      };
      router.replace(roleRedirects[role] ?? '/auth/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); // intentionally omit allowedRoles — it's a new array every render
}