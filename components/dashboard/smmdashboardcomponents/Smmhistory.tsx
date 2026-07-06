"use client";

import { useMemo, useState } from "react";
import {
  SMMTask,
  PostingEntry,
  TASK_TYPE_META,
  CONTENT_TYPE_META,
  TaskType,
  ContentType,
} from "@/types/smm/SMM";
import styles from "@/public/assets/styles/dashboard/smmdashboard/Smmhistory.module.css";

interface SMMHistoryProps {
  completedTasks: SMMTask[];
  completedPosting: PostingEntry[];
}

type RecordItem = {
  id: string;
  title: string;
  brand: string;
  brandColor: string;
  date: string;
  kind: "task" | "posting";
  typeLabel: string;
  typeBg: string;
  typeColor: string;
};

const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

export default function SMMHistory({ completedTasks, completedPosting }: SMMHistoryProps) {
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [kindFilter, setKindFilter] = useState<"all" | "task" | "posting">("all");

  const allRecords: RecordItem[] = useMemo(() => {
    const fromTasks: RecordItem[] = completedTasks.map((t) => {
      const meta = TASK_TYPE_META[t.taskType as TaskType];
      return {
        id: t.id,
        title: t.title,
        brand: t.brand,
        brandColor: t.brandColor,
        date: t.completedAt ?? t.dueDate,
        kind: "task",
        typeLabel: meta.label,
        typeBg: meta.bg,
        typeColor: meta.color,
      };
    });
    const fromPosting: RecordItem[] = completedPosting.map((p) => {
      const meta = CONTENT_TYPE_META[p.contentType as ContentType];
      return {
        id: p.id,
        title: p.title,
        brand: p.brand,
        brandColor: p.brandColor,
        date: p.date,
        kind: "posting",
        typeLabel: `${meta.icon} ${meta.label}`,
        typeBg: meta.bg,
        typeColor: meta.color,
      };
    });
    return [...fromTasks, ...fromPosting];
  }, [completedTasks, completedPosting]);

  const months = useMemo(() => {
    const set = new Set(allRecords.map((r) => r.date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [allRecords]);

  const filtered = useMemo(() => {
    return allRecords.filter((r) => {
      if (monthFilter !== "all" && r.date.slice(0, 7) !== monthFilter) return false;
      if (kindFilter !== "all" && r.kind !== kindFilter) return false;
      return true;
    });
  }, [allRecords, monthFilter, kindFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, RecordItem[]>();
    filtered.forEach((r) => {
      const key = r.date.slice(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const breakdown = useMemo(() => {
    const counts: Record<string, { count: number; bg: string; color: string }> = {};
    filtered.forEach((r) => {
      if (!counts[r.typeLabel]) counts[r.typeLabel] = { count: 0, bg: r.typeBg, color: r.typeColor };
      counts[r.typeLabel].count += 1;
    });
    const max = Math.max(1, ...Object.values(counts).map((c) => c.count));
    return Object.entries(counts)
      .map(([label, v]) => ({ label, ...v, pct: Math.round((v.count / max) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Past Record</h2>
          <p className={styles.sub}>
            {filtered.length} items completed{monthFilter !== "all" ? ` in ${monthLabel(monthFilter)}` : " overall"}
          </p>
        </div>
        <div className={styles.filterRow}>
          <div className={styles.kindPills}>
            {(["all", "task", "posting"] as const).map((k) => (
              <button
                key={k}
                className={`${styles.kindPill} ${kindFilter === k ? styles.kindPillActive : ""}`}
                onClick={() => setKindFilter(k)}
              >
                {k === "all" ? "All" : k === "task" ? "Tasks" : "Posting"}
              </button>
            ))}
          </div>
          <select className={styles.monthSelect} value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
            <option value="all">All Time</option>
            {months.map((m) => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Type breakdown ── */}
      {breakdown.length > 0 && (
        <div className={styles.breakdownCard}>
          <h3 className={styles.breakdownTitle}>Work Breakdown</h3>
          <div className={styles.breakdownList}>
            {breakdown.map(({ label, count, pct, color }) => (
              <div key={label} className={styles.breakdownRow}>
                <span className={styles.breakdownLabel}>{label}</span>
                <div className={styles.breakdownBarBg}>
                  <div className={styles.breakdownBarFill} style={{ width: `${pct}%`, background: color }} />
                </div>
                <span className={styles.breakdownCount}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Records grouped by month ── */}
      {grouped.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📁</div>
          <p>No completed work in this range yet.</p>
        </div>
      ) : (
        grouped.map(([ym, monthRecords]) => (
          <div key={ym} className={styles.monthGroup}>
            <div className={styles.monthHeader}>
              <span className={styles.monthLabel}>{monthLabel(ym)}</span>
              <span className={styles.monthCount}>{monthRecords.length} completed</span>
              <span className={styles.monthLine} />
            </div>

            <div className={styles.recordList}>
              {monthRecords
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((r) => (
                  <div key={`${r.kind}-${r.id}`} className={styles.recordItem}>
                    <span className={styles.recordType} style={{ background: r.typeBg, color: r.typeColor }}>
                      {r.typeLabel}
                    </span>
                    <div className={styles.recordInfo}>
                      <span className={styles.recordTitle}>{r.title}</span>
                      <span className={styles.recordMeta}>
                        <span className={styles.recordBrandDot} style={{ background: r.brandColor }} />
                        {r.brand} &middot; {r.date}
                      </span>
                    </div>
                    <span className={styles.recordDoneTag}>✓ Done</span>
                  </div>
                ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}