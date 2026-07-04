"use client";

import styles from "@/public/assets/styles/dashboard/designerdashboard/Designerstatscards.module.css";

interface DesignerStatsCardsProps {
  todayTasks: number;
  todayCompleted: number;
  needsAttention: number;
  completedThisMonth: number;
  additionalPending: number;
}

export default function DesignerStatsCards({
  todayTasks,
  todayCompleted,
  needsAttention,
  completedThisMonth,
  additionalPending,
}: DesignerStatsCardsProps) {
  const cards = [
    {
      label: "Today's Tasks",
      value: `${todayCompleted}/${todayTasks}`,
      sub: todayTasks === 0 ? "Nothing assigned today" : "done today",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
      accent: "indigo",
    },
    {
      label: "Needs Attention",
      value: String(needsAttention),
      sub: "rejected / change requests",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
      accent: "red",
    },
    {
      label: "Completed This Month",
      value: String(completedThisMonth),
      sub: "tasks delivered",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      accent: "green",
    },
    {
      label: "Additional Work",
      value: String(additionalPending),
      sub: "extra tasks pending",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 5v14M5 12h14" />
        </svg>
      ),
      accent: "amber",
    },
  ];

  return (
    <div className={styles.grid}>
      {cards.map((c) => (
        <div key={c.label} className={`${styles.card} ${styles[c.accent]}`}>
          <div className={styles.cardTop}>
            <span className={styles.iconWrap}>{c.icon}</span>
          </div>
          <div className={styles.value}>{c.value}</div>
          <div className={styles.label}>{c.label}</div>
          <div className={styles.sub}>{c.sub}</div>
        </div>
      ))}
    </div>
  );
}