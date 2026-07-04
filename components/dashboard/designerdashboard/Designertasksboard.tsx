"use client";

import { useMemo, useState } from "react";
import {
  DesignTask,
  TaskStatus,
  TaskType,
  Frequency,
  TASK_TYPE_META,
  FREQUENCY_META,
} from "@/types/designer/Designer";
import styles from "@/public/assets/styles/dashboard/designerdashboard/Designertasksboard.module.css";

interface DesignerTasksBoardProps {
  tasks: DesignTask[];
  onStatusChange: (id: string, status: TaskStatus) => void;
  onReplyToChange: (taskId: string, changeId: string, response: string) => void;
  showFilters?: boolean;
  title?: string;
  subtitle?: string;
}

const statusLabel = (s: TaskStatus) => {
  if (s === "in_progress") return "In Progress";
  if (s === "changes_requested") return "Changes Requested";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const dateLabel = (dateStr: string) => {
  const today = new Date().toISOString().split("T")[0];
  const t = new Date();
  t.setDate(t.getDate() + 1);
  const tomorrow = t.toISOString().split("T")[0];
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterday = y.toISOString().split("T")[0];

  if (dateStr === today) return "Today";
  if (dateStr === tomorrow) return "Tomorrow";
  if (dateStr === yesterday) return "Yesterday";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

export default function DesignerTasksBoard({
  tasks,
  onStatusChange,
  onReplyToChange,
  showFilters = true,
  title = "My Tasks",
  subtitle = "Everything assigned to you, grouped by day",
}: DesignerTasksBoardProps) {
  const [dateFilter, setDateFilter] = useState<string>("");
  const [rangeFilter, setRangeFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [frequencyFilter, setFrequencyFilter] = useState<"all" | Frequency>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | TaskType>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split("T")[0];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const monthStr = today.slice(0, 7);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (dateFilter && t.dueDate !== dateFilter) return false;
      if (rangeFilter === "today" && t.dueDate !== today) return false;
      if (rangeFilter === "week" && t.dueDate < weekStartStr) return false;
      if (rangeFilter === "month" && !t.dueDate.startsWith(monthStr)) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (frequencyFilter !== "all" && t.frequency !== frequencyFilter) return false;
      if (typeFilter !== "all" && t.taskType !== typeFilter) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, dateFilter, rangeFilter, statusFilter, frequencyFilter, typeFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, DesignTask[]>();
    [...filtered]
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .forEach((t) => {
        if (!map.has(t.dueDate)) map.set(t.dueDate, []);
        map.get(t.dueDate)!.push(t);
      });
    return Array.from(map.entries());
  }, [filtered]);

  const resetFilters = () => {
    setDateFilter("");
    setRangeFilter("all");
    setStatusFilter("all");
    setFrequencyFilter("all");
    setTypeFilter("all");
  };

  const hasUnresolvedChanges = (task: DesignTask) =>
    task.changes.some((c) => !c.resolved);

  const sendReply = (task: DesignTask, changeId: string) => {
    const text = replyDrafts[changeId] ?? "";
    if (!text.trim()) return;
    onReplyToChange(task.id, changeId, text.trim());
    setReplyDrafts((prev) => ({ ...prev, [changeId]: "" }));
  };

  const cycleAction = (task: DesignTask): { label: string; next: TaskStatus } | null => {
    if (task.status === "pending") return { label: "Start Task", next: "in_progress" };
    if (task.status === "in_progress") return { label: "Submit for Review", next: "completed" };
    if ((task.status === "rejected" || task.status === "changes_requested") && !hasUnresolvedChanges(task)) {
      return { label: "Resubmit", next: "completed" };
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.sub}>{subtitle}</p>
        </div>
      </div>

      {showFilters && (
        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Quick Range</label>
            <div className={styles.pillRow}>
              {(["all", "today", "week", "month"] as const).map((r) => (
                <button
                  key={r}
                  className={`${styles.pillBtn} ${rangeFilter === r ? styles.pillActive : ""}`}
                  onClick={() => {
                    setRangeFilter(r);
                    setDateFilter("");
                  }}
                >
                  {r === "all" ? "All" : r === "today" ? "Today" : r === "week" ? "This Week" : "This Month"}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Specific Date</label>
            <input
              type="date"
              className={styles.dateInput}
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setRangeFilter("all");
              }}
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Frequency</label>
            <select
              className={styles.selectInput}
              value={frequencyFilter}
              onChange={(e) => setFrequencyFilter(e.target.value as "all" | Frequency)}
            >
              <option value="all">All Frequencies</option>
              {(Object.keys(FREQUENCY_META) as Frequency[]).map((f) => (
                <option key={f} value={f}>{FREQUENCY_META[f].label}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Task Type</label>
            <select
              className={styles.selectInput}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "all" | TaskType)}
            >
              <option value="all">All Types</option>
              {(Object.keys(TASK_TYPE_META) as TaskType[]).map((t) => (
                <option key={t} value={t}>{TASK_TYPE_META[t].label}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Status</label>
            <select
              className={styles.selectInput}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | TaskStatus)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="changes_requested">Changes Requested</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <button className={styles.resetBtn} onClick={resetFilters}>
            Reset
          </button>
        </div>
      )}

      {grouped.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎨</div>
          <p>No tasks match these filters.</p>
        </div>
      ) : (
        grouped.map(([date, dayTasks]) => (
          <div key={date} className={styles.dayGroup}>
            <div className={styles.dayHeader}>
              <span className={styles.dayLabel}>{dateLabel(date)}</span>
              <span className={styles.dayCount}>{dayTasks.length} task{dayTasks.length > 1 ? "s" : ""}</span>
              <span className={styles.dayLine} />
            </div>

            <div className={styles.tasksGrid}>
              {dayTasks.map((task) => {
                const typeMeta = TASK_TYPE_META[task.taskType];
                const freqMeta = FREQUENCY_META[task.frequency];
                const action = cycleAction(task);
                const isExpanded = expandedId === task.id;
                const needsAttentionBanner = task.status === "rejected" || task.status === "changes_requested";

                return (
                  <div key={task.id} className={`${styles.taskCard} ${styles[`border_${task.status}`]}`}>
                    <div className={styles.cardTop}>
                      <span className={styles.typeTag} style={{ background: typeMeta.bg, color: typeMeta.color }}>
                        {typeMeta.label}
                      </span>
                      <span className={`${styles.statusPill} ${styles[`pill_${task.status}`]}`}>
                        {statusLabel(task.status)}
                      </span>
                    </div>

                    <h3 className={styles.taskTitle}>{task.title}</h3>
                    <p className={styles.taskDesc}>{task.description}</p>

                    <div className={styles.metaRow}>
                      <span className={styles.brandRow}>
                        <span className={styles.brandDot} style={{ background: task.brandColor }} />
                        {task.brand}
                      </span>
                      <span className={styles.freqTag} style={{ background: freqMeta.bg, color: freqMeta.color }}>
                        {freqMeta.label}
                      </span>
                    </div>

                    <div className={styles.dueRow}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Due {task.dueDate}
                      <span className={styles.assignedBy}>&middot; by {task.assignedBy}</span>
                    </div>

                    {needsAttentionBanner && task.rejectRemark && (
                      <div className={styles.remarkBanner}>
                        <span className={styles.remarkIcon}>⚠️</span>
                        <div>
                          <span className={styles.remarkTitle}>
                            {task.status === "rejected" ? "Rejection Reason" : "Changes Requested"}
                          </span>
                          <p className={styles.remarkText}>{task.rejectRemark}</p>
                        </div>
                      </div>
                    )}

                    {task.changes.length > 0 && (
                      <button
                        className={`${styles.changeToggle} ${needsAttentionBanner ? styles.changeToggleAlert : ""}`}
                        onClick={() => setExpandedId(isExpanded ? null : task.id)}
                      >
                        <span className={styles.changeBubble}>{task.changes.length}</span>
                        Change Log {isExpanded ? "▲" : "▼"}
                      </button>
                    )}

                    {isExpanded && (
                      <div className={styles.changeList}>
                        {task.changes.map((ch) => (
                          <div key={ch.id} className={styles.changeItem}>
                            <div className={styles.changeTop}>
                              <span className={styles.changeBy}>{ch.changedBy}</span>
                              <span className={styles.changeDate}>{ch.changedAt}</span>
                              {ch.resolved && <span className={styles.resolvedBadge}>✓ Resolved</span>}
                            </div>
                            <p className={styles.changeNote}>{ch.note}</p>

                            {ch.designerResponse && (
                              <div className={styles.designerResponse}>
                                <span className={styles.designerResponseLabel}>💬 Your Reply</span>
                                <p className={styles.designerResponseText}>{ch.designerResponse}</p>
                              </div>
                            )}

                            {!ch.resolved && !ch.designerResponse && (
                              <div className={styles.replyBox}>
                                <textarea
                                  className={styles.replyInput}
                                  rows={2}
                                  placeholder="Write your reply after making the fix…"
                                  value={replyDrafts[ch.id] ?? ""}
                                  onChange={(e) =>
                                    setReplyDrafts((prev) => ({ ...prev, [ch.id]: e.target.value }))
                                  }
                                />
                                <button className={styles.replyBtn} onClick={() => sendReply(task, ch.id)}>
                                  Send Reply
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className={styles.cardFooter}>
                      {action ? (
                        <button
                          className={`${styles.actionBtn} ${styles[`action_${task.status}`]}`}
                          onClick={() => onStatusChange(task.id, action.next)}
                        >
                          {action.label}
                        </button>
                      ) : task.status === "completed" ? (
                        <span className={styles.doneTag}>✓ Completed</span>
                      ) : (
                        <span className={styles.waitingTag}>Reply to all notes to resubmit</span>
                      )}
                    </div>
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