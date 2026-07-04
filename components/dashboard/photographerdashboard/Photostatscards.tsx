"use client";

import styles from "@/public/assets/styles/dashboard/photographer-dashboard/Photostatscards.module.css";

interface PhotoStatsCardsProps {
  todayShoots: number;
  todayShootsCompleted: number;
  todayEdits: number;
  todayEditsCompleted: number;
  additionalPending: number;
}

export default function PhotoStatsCards({
  todayShoots,
  todayShootsCompleted,
  todayEdits,
  todayEditsCompleted,
  additionalPending,
}: PhotoStatsCardsProps) {
  const cards = [
    {
      label: "Today's Shoots",
      value: `${todayShootsCompleted}/${todayShoots}`,
      sub: todayShoots === 0 ? "Nothing scheduled" : "shoots done today",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      ),
      accent: "amber",
    },
    {
      label: "Today's Edits",
      value: `${todayEditsCompleted}/${todayEdits}`,
      sub: todayEdits === 0 ? "Nothing queued" : "edit tasks done today",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
      accent: "pink",
    },
    {
      label: "Pending Today",
      value: String(todayShoots - todayShootsCompleted + (todayEdits - todayEditsCompleted)),
      sub: "shoots + edits left",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
      accent: "indigo",
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