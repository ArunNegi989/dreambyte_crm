"use client";

import { useState } from "react";
import { EditTask, WorkStatus } from "@/types/photography/Photo";
import styles from "@/public/assets/styles/dashboard/photographer-dashboard/Editsboard.module.css";

interface EditsBoardProps {
  edits: EditTask[];
  onProgressChange: (id: string, completedCount: number) => void;
}

const statusLabel = (s: WorkStatus) =>
  s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1);

export default function EditsBoard({ edits, onProgressChange }: EditsBoardProps) {
  const [filter, setFilter] = useState<"all" | WorkStatus>("all");
  const [mediaFilter, setMediaFilter] = useState<"all" | "photo" | "video">("all");

  const filtered = edits.filter((e) => {
    const statusOk = filter === "all" || e.status === filter;
    const mediaOk = mediaFilter === "all" || e.mediaType === mediaFilter;
    return statusOk && mediaOk;
  });

  const bump = (task: EditTask, delta: number) => {
    const next = Math.max(0, Math.min(task.totalCount, task.completedCount + delta));
    onProgressChange(task.id, next);
  };

  const isOverdue = (deadline: string, status: WorkStatus) => {
    if (status === "completed") return false;
    const today = new Date().toISOString().split("T")[0];
    return deadline < today;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Edits</h2>
          <p className={styles.sub}>{edits.length} total &middot; photo + video edit queue</p>
        </div>
        <div className={styles.filterGroup}>
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
          <div className={styles.filterWrap}>
            {(["all", "photo", "video"] as const).map((m) => (
              <button
                key={m}
                className={`${styles.filterBtn} ${mediaFilter === m ? styles.filterActive : ""}`}
                onClick={() => setMediaFilter(m)}
              >
                {m === "all" ? "All Media" : m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🖥️</div>
          <p>No edit tasks in this filter.</p>
        </div>
      ) : (
        <div className={styles.editsGrid}>
          {filtered.map((task) => {
            const pct = task.totalCount > 0 ? Math.round((task.completedCount / task.totalCount) * 100) : 0;
            const overdue = isOverdue(task.deadline, task.status);

            return (
              <div key={task.id} className={`${styles.editCard} ${styles[`border_${task.status}`]}`}>
                <div className={styles.cardTop}>
                  <span className={`${styles.mediaTag} ${styles[`media_${task.mediaType}`]}`}>
                    {task.mediaType === "video" ? (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" />
                      </svg>
                    ) : (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    )}
                    {task.mediaType}
                  </span>
                  <span className={`${styles.statusPill} ${styles[`pill_${task.status}`]}`}>
                    {statusLabel(task.status)}
                  </span>
                </div>

                <h3 className={styles.editTitle}>{task.title}</h3>

                <div className={styles.brandRow}>
                  <span className={styles.brandDot} style={{ background: task.brandColor }} />
                  <span className={styles.brandName}>{task.brand}</span>
                </div>

                {/* Progress */}
                <div className={styles.progressWrap}>
                  <div className={styles.progressBarBg}>
                    <div
                      className={`${styles.progressBarFill} ${styles[`fill_${task.status}`]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className={styles.progressMeta}>
                    <span className={styles.progressCount}>
                      {task.completedCount}/{task.totalCount} {task.mediaType === "photo" ? "photos" : "cut"} edited
                    </span>
                    <span className={styles.progressPct}>{pct}%</span>
                  </div>
                </div>

                <div className={styles.deadlineRow}>
                  <span className={`${styles.deadline} ${overdue ? styles.overdue : ""}`}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Due {task.deadline} {overdue && "· Overdue"}
                  </span>
                  <span className={styles.assignedBy}>by {task.assignedBy}</span>
                </div>

                {/* Actions */}
                <div className={styles.cardFooter}>
                  {task.mediaType === "photo" && task.totalCount > 1 && task.status !== "completed" ? (
                    <div className={styles.stepper}>
                      <button className={styles.stepBtn} onClick={() => bump(task, -1)} disabled={task.completedCount === 0}>
                        −
                      </button>
                      <span className={styles.stepCount}>{task.completedCount}</span>
                      <button className={styles.stepBtn} onClick={() => bump(task, 1)} disabled={task.completedCount >= task.totalCount}>
                        +
                      </button>
                    </div>
                  ) : (
                    <span />
                  )}

                  {task.status !== "completed" ? (
                    <button
                      className={styles.markDoneBtn}
                      onClick={() => onProgressChange(task.id, task.totalCount)}
                    >
                      Mark All Done
                    </button>
                  ) : (
                    <span className={styles.doneTag}>✓ Edited</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}