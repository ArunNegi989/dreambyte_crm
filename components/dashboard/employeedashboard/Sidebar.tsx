'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import styles from '../../../assets/styles/employeedashboard/Sidebar.module.css';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard/employeedashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="5" rx="1.5" />
        <rect x="13" y="11" width="8" height="10" rx="1.5" />
        <rect x="3" y="14" width="8" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: 'Tasks',
    href: '/dashboard/employeedashboard/tasks',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M9 11l2 2 4-4" />
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    ),
  },
  {
    label: 'Additional Tasks',
    href: '/dashboard/employeedashboard/additional-tasks',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    label: 'My Profile',
    href: '/dashboard/employeedashboard/profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 21c0-3.9 3.1-7 7-7s7 3.1 7 7" />
      </svg>
    ),
  },
  // {
  //   label: 'Messages',
  //   href: '/dashboard/employeedashboard/messages',
  //   icon: (
  //     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
  //       <path d="M21 11.5a8.5 8.5 0 1 1-3.8-7.1L21 3l-1.2 4.3c.8 1.2 1.2 2.6 1.2 4.2Z" />
  //     </svg>
  //   ),
  // },
  // {
  //   label: 'Settings',
  //   href: '/dashboard/employeedashboard/settings',
  //   icon: (
  //     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
  //       <circle cx="12" cy="12" r="3" />
  //       <path d="M19.4 13a7.7 7.7 0 0 0 0-2l2-1.5-2-3.4-2.3.9a7.6 7.6 0 0 0-1.7-1L15 3h-4l-.4 2.3a7.6 7.6 0 0 0-1.7 1l-2.3-.9-2 3.4L6.6 11a7.7 7.7 0 0 0 0 2l-2 1.5 2 3.4 2.3-.9c.5.4 1.1.8 1.7 1L11 21h4l.4-2.3c.6-.2 1.2-.6 1.7-1l2.3.9 2-3.4-2-1.5Z" />
  //     </svg>
  //   ),
  // },
];

const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <svg className={styles.logo} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="40" height="40" rx="8" fill="#000000" />
          <path d="M24 12L34 32H14L24 12Z" fill="#FFFFFF" />
        </svg>
        <span className={styles.brandName}>Dreambyte CRM</span>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <a 
            key={item.label} 
            href={item.href} 
            className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ''}`}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;