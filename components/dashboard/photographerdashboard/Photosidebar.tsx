"use client";

import { useState } from "react";
import styles from "@/public/assets/styles/dashboard/photographer-dashboard/Photosidebar.module.css";

export type PhotoSection = "overview" | "shoots" | "edits" | "additional";

interface PhotoSidebarProps {
  activeSection: PhotoSection;
  onSectionChange: (section: PhotoSection) => void;
  pendingShoots: number;
  pendingEdits: number;
}

const navItems: { id: PhotoSection; label: string; icon: JSX.Element }[] = [
  {
    id: "overview",
    label: "Overview",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    id: "shoots",
    label: "Shoots",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
  },
  {
    id: "edits",
    label: "Edits",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    id: "additional",
    label: "Additional Work",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
];

export default function PhotoSidebar({
  activeSection,
  onSectionChange,
  pendingShoots,
  pendingEdits,
}: PhotoSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const badgeFor = (id: PhotoSection) => {
    if (id === "shoots" && pendingShoots > 0) return pendingShoots;
    if (id === "edits" && pendingEdits > 0) return pendingEdits;
    return 0;
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
        {!collapsed && (
          <div className={styles.logoTextWrap}>
            <span className={styles.logoText}>DreamByte</span>
            <span className={styles.logoSub}>Photography</span>
          </div>
        )}
      </div>

      <button className={styles.toggleBtn} onClick={() => setCollapsed(!collapsed)}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {collapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
        </svg>
      </button>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const badge = badgeFor(item.id);
          return (
            <button
              key={item.id}
              className={`${styles.navItem} ${activeSection === item.id ? styles.active : ""}`}
              onClick={() => onSectionChange(item.id)}
              title={collapsed ? item.label : ""}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
              {badge > 0 && <span className={styles.navBadge}>{badge}</span>}
            </button>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.photographerBadge}>
          <div className={styles.photographerAvatar}>P</div>
          {!collapsed && (
            <div className={styles.photographerInfo}>
              <span className={styles.photographerName}>Photographer</span>
              <span className={styles.photographerRole}>Field &amp; Edit Team</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}