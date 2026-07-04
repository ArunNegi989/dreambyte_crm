"use client";

import { useMemo, useState } from "react";
import { DesignTask, TASK_TYPE_META, TaskType } from "@/types/designer/Designer";
import styles from "@/public/assets/styles/dashboard/designerdashboard/Designerhistory.module.css";

interface DesignerHistoryProps {
  tasks: DesignTask[]; // only completed tasks passed in
}

const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

export default function DesignerHistory({ tasks }: DesignerHistoryProps) {
  const [monthFilter, setMonthFilter] = useState<string>("all");

  const months = useMemo(() => {
    const set = new Set(tasks.map((t) => (t.completedAt ?? t.dueDate).slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (monthFilter === "all") return tasks;
    return tasks.filter((t) => (t.completedAt ?? t.dueDate).slice(0, 7) === monthFilter);
  }, [tasks, monthFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, DesignTask[]>();
    filteredTasks.forEach((t) => {
      const key = (t.completedAt ?? t.dueDate).slice(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTasks]);

  const typeBreakdown = useMemo(() => {
    const counts: Partial<Record<TaskType, number>> = {};
    filteredTasks.forEach((t) => {
      counts[t.taskType] = (counts[t.taskType] ?? 0) + 1;
    });
    const max = Math.max(1, ...Object.values(counts));
    return (Object.keys(counts) as TaskType[])
      .map((type) => ({ type, count: counts[type]!, pct: Math.round((counts[type]! / max) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [filteredTasks]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Past Record</h2>
          <p className={styles.sub}>{filteredTasks.length} tasks completed{monthFilter !== "all" ? ` in ${monthLabel(monthFilter)}` : " overall"}</p>
        </div>
        <select
          className={styles.monthSelect}
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
        >
          <option value="all">All Time</option>
          {months.map((m) => (
            <option key={m} value={m}>{monthLabel(m)}</option>
          ))}
        </select>
      </div>

      {/* ── Type breakdown ── */}
      {typeBreakdown.length > 0 && (
        <div className={styles.breakdownCard}>
          <h3 className={styles.breakdownTitle}>Work Breakdown by Type</h3>
          <div className={styles.breakdownList}>
            {typeBreakdown.map(({ type, count, pct }) => {
              const meta = TASK_TYPE_META[type];
              return (
                <div key={type} className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>{meta.label}</span>
                  <div className={styles.breakdownBarBg}>
                    <div
                      className={styles.breakdownBarFill}
                      style={{ width: `${pct}%`, background: meta.color }}
                    />
                  </div>
                  <span className={styles.breakdownCount}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Completed tasks, grouped by month ── */}
      {grouped.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📁</div>
          <p>No completed work in this range yet.</p>
        </div>
      ) : (
        grouped.map(([ym, monthTasks]) => (
          <div key={ym} className={styles.monthGroup}>
            <div className={styles.monthHeader}>
              <span className={styles.monthLabel}>{monthLabel(ym)}</span>
              <span className={styles.monthCount}>{monthTasks.length} completed</span>
              <span className={styles.monthLine} />
            </div>

            <div className={styles.recordList}>
              {monthTasks
                .sort((a, b) => (b.completedAt ?? b.dueDate).localeCompare(a.completedAt ?? a.dueDate))
                .map((task) => {
                  const meta = TASK_TYPE_META[task.taskType];
                  return (
                    <div key={task.id} className={styles.recordItem}>
                      <span className={styles.recordType} style={{ background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                      <div className={styles.recordInfo}>
                        <span className={styles.recordTitle}>{task.title}</span>
                        <span className={styles.recordMeta}>
                          <span className={styles.recordBrandDot} style={{ background: task.brandColor }} />
                          {task.brand} &middot; Completed {task.completedAt ?? task.dueDate}
                        </span>
                      </div>
                      <span className={styles.recordDoneTag}>✓ Done</span>
                    </div>
                  );
                })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}