"use client";

import { useState } from "react";
import styles from "@/public/assets/styles/dashboard/super-admin-dashboard/Salayout.module.css";

export type SASection =
  | "dashboard"
  | "brands"
  | "employees"
  | "tasks";

interface SALayoutProps {
  activeSection: SASection;
  onSectionChange: (s: SASection) => void;
  children: React.ReactNode;
  pageTitle: string;
  pageSub?: string;
}

const navItems: { id: SASection; label: string; icon: React.ReactNode; badge?: string }[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "brands",
    label: "Brands",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    id: "employees",
    label: "Employees",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
];

export default function SALayout({
  activeSection,
  onSectionChange,
  children,
  pageTitle,
  pageSub,
}: SALayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoMark}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          {!collapsed && (
            <div className={styles.logoText}>
              <span className={styles.logoMain}>DreamByte</span>
              <span className={styles.logoSub}>Super Admin</span>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button className={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {collapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
          </svg>
        </button>

        {/* Nav */}
        <nav className={styles.nav}>
          <span className={styles.navGroup}>{!collapsed && "MAIN MENU"}</span>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`${styles.navItem} ${activeSection === item.id ? styles.navActive : ""}`}
              onClick={() => onSectionChange(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
              {!collapsed && activeSection === item.id && <span className={styles.activeDot} />}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className={styles.sideFooter}>
          <div className={styles.saAvatar}>SA</div>
          {!collapsed && (
            <div className={styles.saInfo}>
              <span className={styles.saName}>Super Admin</span>
              <span className={styles.saRole}>Full Access</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className={`${styles.mainWrap} ${collapsed ? styles.mainCollapsed : ""}`}>
        {/* Top Bar */}
        <header className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>{pageTitle}</h1>
            {pageSub && <p className={styles.pageSub}>{pageSub}</p>}
          </div>
          <div className={styles.topRight}>
            <div className={styles.saTag}>
              <span className={styles.saOnline} />
              Super Admin
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className={styles.pageContent}>{children}</div>
      </div>
    </div>
  );
}