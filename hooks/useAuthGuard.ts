"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

type AllowedRole = 'employee' | 'admin' | 'super_admin';

const ROLE_DASHBOARDS: Record<AllowedRole, string> = {
  employee:    '/dashboard/employeedashboard',
  admin:       '/dashboard/admindashboard',
  super_admin: '/dashboard/superadmindashboard',
};

// Department-specific dashboards — only applied for `employee` role.
// Keys must match the department string stored on the Employee record
// (and in localStorage as `userDepartment`) exactly, case-sensitive.
const DEPARTMENT_DASHBOARDS: Record<string, string> = {
  'meta ads':    '/dashboard/metadashboard',
  'graphic':    '/dashboard/designerdashboard',      // ← confirm actual string
  'photography': '/dashboard/photographydashboard',   // ← confirm actual string
  'smm':         '/dashboard/smmdashboard',            // ← confirm actual string
  'seo':         '/dashboard/seodashboard',            // ← confirm actual string
};

function normalizeDept(dept: string | null): string {
  return (dept || '').trim().toLowerCase();
}



function getHomeRoute(role: AllowedRole | null, department: string | null): string {
  if (role === 'admin') return ROLE_DASHBOARDS.admin;
  if (role === 'super_admin') return ROLE_DASHBOARDS.super_admin;
  if (role === 'employee') {
    const key = normalizeDept(department);
    return DEPARTMENT_DASHBOARDS[key] || ROLE_DASHBOARDS.employee;
  }
  return '/auth/login';
}


export function useAuthGuard(allowedRoles: AllowedRole[], allowedDepartments?: string[]) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole') as AllowedRole | null;
    const department = localStorage.getItem('userDepartment');

    if (!token || !role) {
      router.replace('/auth/login');
      return;
    }

    if (!allowedRoles.includes(role)) {
      router.replace(getHomeRoute(role, department));
      return;
    }

    if (
      role === 'employee' &&
      allowedDepartments &&
      allowedDepartments.length > 0 &&
      !allowedDepartments.map(d => d.trim().toLowerCase()).includes(normalizeDept(department))
    ) {
      router.replace(getHomeRoute(role, department));
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); // intentionally omit allowedRoles/allowedDepartments — new array every render
}