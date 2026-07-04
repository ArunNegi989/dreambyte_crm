"use client";

import { useState } from "react";
import styles from "@/public/assets/styles/dashboard/designerdashboard/Designersidebar.module.css";

export type DesignerSection = "overview" | "tasks" | "additional" | "history";

interface DesignerSidebarProps {
  activeSection: DesignerSection;
  onSectionChange: (section: DesignerSection) => void;
  pendingTasks: number;
  needsAttention: number; // rejected + changes_requested
}

const navItems: { id: DesignerSection; label: string; icon: JSX.Element }[] = [
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

export default function DesignerSidebar({
  activeSection,
  onSectionChange,
  pendingTasks,
  needsAttention,
}: DesignerSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const badgeFor = (id: DesignerSection) => {
    if (id === "tasks") return pendingTasks + needsAttention;
    return 0;
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.586 7.586" />
            <circle cx="11" cy="11" r="2" />
          </svg>
        </div>
        {!collapsed && (
          <div className={styles.logoTextWrap}>
            <span className={styles.logoText}>DreamByte</span>
            <span className={styles.logoSub}>Design Studio</span>
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
        <div className={styles.designerBadge}>
          <div className={styles.designerAvatar}>D</div>
          {!collapsed && (
            <div className={styles.designerInfo}>
              <span className={styles.designerName}>Designer</span>
              <span className={styles.designerRole}>Graphic &amp; Video Team</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}