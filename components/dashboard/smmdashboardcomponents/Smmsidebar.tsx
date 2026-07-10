"use client";

import { useState } from "react";
import type { JSX } from "react";
import styles from "@/public/assets/styles/dashboard/smmdashboard/Smmsidebar.module.css";

export type SMMSection = "overview" | "tasks" | "posting" | "additional" | "history";

interface SMMSidebarProps {
  activeSection: SMMSection;
  onSectionChange: (section: SMMSection) => void;
  pendingTasks: number;
  needsAttention: number;
}

const navItems: { id: SMMSection; label: string; icon: JSX.Element }[] = [
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
    id: "tasks",
    label: "My Tasks",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    id: "posting",
    label: "Posting Tracker",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
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
  {
    id: "history",
    label: "Past Record",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
  },
];

export default function SMMSidebar({
  activeSection,
  onSectionChange,
  pendingTasks,
  needsAttention,
}: SMMSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const badgeFor = (id: SMMSection) => {
    if (id === "tasks") return pendingTasks + needsAttention;
    return 0;
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" />
            <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
          </svg>
        </div>
        {!collapsed && (
          <div className={styles.logoTextWrap}>
            <span className={styles.logoText}>DreamByte</span>
            <span className={styles.logoSub}>Social Team</span>
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

      {needsAttention > 0 && !collapsed && (
        <div className={styles.attentionCard}>
          <span className={styles.attentionDot} />
          <div>
            <div className={styles.attentionTitle}>{needsAttention} need attention</div>
            <div className={styles.attentionSub}>Rejected or change requests</div>
          </div>
        </div>
      )}

      <div className={styles.sidebarFooter}>
        <div className={styles.smmBadge}>
          <div className={styles.smmAvatar}>S</div>
          {!collapsed && (
            <div className={styles.smmInfo}>
              <span className={styles.smmName}>Social Media Manager</span>
              <span className={styles.smmRole}>Content &amp; Growth Team</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}