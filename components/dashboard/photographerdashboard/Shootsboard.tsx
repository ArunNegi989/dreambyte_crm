"use client";

import { useMemo, useState } from "react";
import { Shoot, WorkStatus } from "@/types/photography/Photo";
import styles from "@/public/assets/styles/dashboard/photographer-dashboard/Shootsboard.module.css";

interface ShootsBoardProps {
  shoots: Shoot[];
  onStatusChange: (id: string, status: WorkStatus) => void;
}

const typeIcon = (type: Shoot["type"]) => {
  if (type === "video")
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" />
      </svg>
    );
  if (type === "both")
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18M3 12h18" />
      </svg>
    );
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
};

const statusLabel = (s: WorkStatus) =>
  s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1);

const dateLabel = (dateStr: string, today: string, tomorrow: string, yesterday: string) => {
  if (dateStr === today) return "Today";
  if (dateStr === tomorrow) return "Tomorrow";
  if (dateStr === yesterday) return "Yesterday";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

export default function ShootsBoard({ shoots, onStatusChange }: ShootsBoardProps) {
  const [filter, setFilter] = useState<"all" | WorkStatus>("all");

  const today = new Date().toISOString().split("T")[0];
  const tmrDate = new Date();
  tmrDate.setDate(tmrDate.getDate() + 1);
  const tomorrow = tmrDate.toISOString().split("T")[0];
  const ystDate = new Date();
  ystDate.setDate(ystDate.getDate() - 1);
  const yesterday = ystDate.toISOString().split("T")[0];

  const filtered = filter === "all" ? shoots : shoots.filter((s) => s.status === filter);

  const grouped = useMemo(() => {
    const map = new Map<string, Shoot[]>();
    [...filtered]
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .forEach((s) => {
        if (!map.has(s.date)) map.set(s.date, []);
        map.get(s.date)!.push(s);
      });
    return Array.from(map.entries());
  }, [filtered]);

  const cycleStatus = (current: WorkStatus): WorkStatus => {
    if (current === "pending") return "in_progress";
    if (current === "in_progress") return "completed";
    return "pending";
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Shoots</h2>
          <p className={styles.sub}>{shoots.length} total &middot; assigned by admin / super admin</p>
        </div>
        <div className={styles.filterWrap}>
          {(["all", "pending", "in_progress", "completed"] as const).map((f) => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : statusLabel(f)}
            </button>
          ))}
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎬</div>
          <p>No shoots in this filter.</p>
        </div>
      ) : (
        grouped.map(([date, dayShoots]) => (
          <div key={date} className={styles.dayGroup}>
            <div className={styles.dayHeader}>
              <span className={styles.dayLabel}>{dateLabel(date, today, tomorrow, yesterday)}</span>
              <span className={styles.dayCount}>{dayShoots.length} shoot{dayShoots.length > 1 ? "s" : ""}</span>
              <span className={styles.dayLine} />
            </div>

            <div className={styles.shootsGrid}>
              {dayShoots.map((shoot) => (
                <div key={shoot.id} className={`${styles.shootCard} ${styles[`border_${shoot.status}`]}`}>
                  <div className={styles.cardTop}>
                    <span className={styles.time}>{shoot.time}</span>
                    <span className={`${styles.statusPill} ${styles[`pill_${shoot.status}`]}`}>
                      {statusLabel(shoot.status)}
                    </span>
                  </div>

                  <h3 className={styles.shootTitle}>{shoot.title}</h3>

                  <div className={styles.brandRow}>
                    <span className={styles.brandDot} style={{ background: shoot.brandColor }} />
                    <span className={styles.brandName}>{shoot.brand}</span>
                    <span className={styles.typeTag}>
                      {typeIcon(shoot.type)}
                      {shoot.type}
                    </span>
                  </div>

                  <div className={styles.locationRow}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {shoot.location}
                  </div>

                  {shoot.notes && <p className={styles.notes}>📝 {shoot.notes}</p>}

                  <div className={styles.cardFooter}>
                    <span className={styles.assignedBy}>Assigned by {shoot.assignedBy}</span>
                    <button
                      className={`${styles.actionBtn} ${styles[`action_${shoot.status}`]}`}
                      onClick={() => onStatusChange(shoot.id, cycleStatus(shoot.status))}
                    >
                      {shoot.status === "pending" && "Start Shoot"}
                      {shoot.status === "in_progress" && "Mark Done"}
                      {shoot.status === "completed" && "✓ Shot Completed"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}