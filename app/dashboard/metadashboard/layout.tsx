"use client";

// app/dashboard/metadashboard/layout.tsx
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '../../../assets/styles/metadashboard/meta-dashboard.css';

const NAV_ITEMS = [
  {
    href: '/dashboard/metadashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/dashboard/metadashboard/tasks',
    label: 'Tasks',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 9h10M7 13h10M7 17h6" />
      </svg>
    ),
  },
  {
    href: '/dashboard/metadashboard/additional-tasks',
    label: 'Additional tasks',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
];

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="md-sidebar">
      <div className="md-brand">
        <span className="md-brand-mark">M</span>
        <span className="md-brand-name">Meta Dashboard</span>
      </div>

      <nav className="md-nav">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`md-nav-item ${active ? 'active' : ''}`}>
              <span className="md-nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default function MetaDashboardLayout({ children }: { children: React.ReactNode }) {
  // useAuthGuard(['meta']); // hook this into the same guard used by other dashboards

  return (
    <div className="md-shell">
      <Sidebar />
      <div className="md-page">{children}</div>
    </div>
  );
}
