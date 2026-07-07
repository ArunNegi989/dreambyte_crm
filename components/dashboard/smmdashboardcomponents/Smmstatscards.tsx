"use client";

import styles from "@/public/assets/styles/dashboard/smmdashboard/Smmstatscards.module.css";

interface SMMStatsCardsProps {
  todayTasks: number;
  todayCompleted: number;
  todayPosting: number;
  todayPostingCompleted: number;
  needsAttention: number;
  additionalPending: number;
}

export default function SMMStatsCards({
  todayTasks,
  todayCompleted,
  todayPosting,
  todayPostingCompleted,
  needsAttention,
  additionalPending,
}: SMMStatsCardsProps) {
  const cards = [
    {
      label: "Today's Tasks",
      value: `${todayCompleted}/${todayTasks}`,
      sub: "scripting, UGC, research etc.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
      accent: "cyan",
    },
    {
      label: "Today's Posting",
      value: `${todayPostingCompleted}/${todayPosting}`,
      sub: "across all brands",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
      accent: "pink",
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
      label: "Additional Work",
      value: String(additionalPending),
      sub: "extra tasks pending",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 5v14M5 12h14" />
        </svg>
      ),
      accent: "green",
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