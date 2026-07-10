"use client";

import { useMemo, useState } from "react";
import {
  RawTask,
  TaskStatus,
  Frequency,
  getTaskTypeMeta,
  FREQUENCY_META,
  getBrandName,
  getTimeTakenLabel,
} from "@/types/smm/SMM";
import styles from "@/public/assets/styles/dashboard/smmdashboard/Smmtasksboard.module.css";

interface SMMTasksBoardProps {
  tasks: RawTask[];
  onStartTask: (id: string) => void;
  onSubmitTask: (id: string, note: string) => void;
  onRespondChanges: (id: string, responses: { id: string; response: string }[]) => void;
  showFilters?: boolean;
  title?: string;
  subtitle?: string;
}

const statusLabel = (s: TaskStatus) => {
  if (s === "in_progress") return "In Progress";
  if (s === "changes_requested") return "Changes Requested";
  if (s === "completed") return "Submitted — In Review";
  if (s === "approved") return "Approved";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const statusColor = (s: TaskStatus) => {
  switch (s) {
    case "pending":
      return { bg: "#f1f5f9", color: "#475569" };
    case "in_progress":
      return { bg: "#eff6ff", color: "#1d4ed8" };
    case "completed":
      return { bg: "#fefce8", color: "#a16207" };
    case "approved":
      return { bg: "#f0fdf4", color: "#15803d" };
    case "rejected":
      return { bg: "#fef2f2", color: "#b91c1c" };
    case "changes_requested":
      return { bg: "#fff7ed", color: "#c2410c" };
    default:
      return { bg: "#f1f5f9", color: "#475569" };
  }
};

const dateLabel = (dateStr: string) => {
  if (!dateStr) return "No due date";
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

export default function SMMTasksBoard({
  tasks,
  onStartTask,
  onSubmitTask,
  onRespondChanges,
  showFilters = true,
  title = "My Tasks",
  subtitle = "Everything assigned to you, grouped by day",
}: SMMTasksBoardProps) {
  const [dateFilter, setDateFilter] = useState<string>("");
  const [rangeFilter, setRangeFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [frequencyFilter, setFrequencyFilter] = useState<"all" | Frequency>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [submitModal, setSubmitModal] = useState<RawTask | null>(null);
  const [submitNote, setSubmitNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resubmitting, setResubmitting] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const monthStr = today.slice(0, 7);

  const typeOptions = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.taskType).filter(Boolean))),
    [tasks]
  );

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (dateFilter && t.dueDate !== dateFilter) return false;
      if (rangeFilter === "today" && t.dueDate !== today) return false;
      if (rangeFilter === "week" && t.dueDate < weekStartStr) return false;
      if (rangeFilter === "month" && !(t.dueDate || "").startsWith(monthStr)) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (frequencyFilter !== "all" && t.frequency !== frequencyFilter) return false;
      if (typeFilter !== "all" && t.taskType !== typeFilter) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, dateFilter, rangeFilter, statusFilter, frequencyFilter, typeFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, RawTask[]>();
    [...filtered]
      .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
      .forEach((t) => {
        const key = t.dueDate || "No due date";
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(t);
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

  const openChanges = (task: RawTask) => task.changes.filter((c) => !c.resolved);

  const allOpenRepliesFilled = (task: RawTask) => {
    const open = openChanges(task);
    return open.length > 0 && open.every((c) => (replyDrafts[c._id] ?? "").trim().length > 0);
  };

  const handleResubmit = async (task: RawTask) => {
    const responses = openChanges(task).map((c) => ({
      id: c._id,
      response: (replyDrafts[c._id] ?? "").trim(),
    }));
    setResubmitting(task._id);
    try {
      await onRespondChanges(task._id, responses);
      setReplyDrafts((prev) => {
        const next = { ...prev };
        responses.forEach((r) => delete next[r.id]);
        return next;
      });
    } finally {
      setResubmitting(null);
    }
  };

  const openSubmitModal = (task: RawTask) => {
    setSubmitModal(task);
    setSubmitNote("");
  };

  const confirmSubmit = async () => {
    if (!submitModal) return;
    setSubmitting(true);
    try {
      await onSubmitTask(submitModal._id, submitNote.trim());
      setSubmitModal(null);
      setSubmitNote("");
    } finally {
      setSubmitting(false);
    }
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
                <option key={f} value={f}>
                  {FREQUENCY_META[f].label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Task Type</label>
            <select className={styles.selectInput} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {getTaskTypeMeta(t).label}
                </option>
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
              <option value="completed">Submitted — In Review</option>
              <option value="approved">Approved</option>
            </select>
          </div>

          <button className={styles.resetBtn} onClick={resetFilters}>
            Reset
          </button>
        </div>
      )}

      {grouped.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <p>No tasks match these filters.</p>
        </div>
      ) : (
        grouped.map(([date, dayTasks]) => (
          <div key={date} className={styles.dayGroup}>
            <div className={styles.dayHeader}>
              <span className={styles.dayLabel}>{dateLabel(date)}</span>
              <span className={styles.dayCount}>
                {dayTasks.length} task{dayTasks.length > 1 ? "s" : ""}
              </span>
              <span className={styles.dayLine} />
            </div>

            <div className={styles.tasksGrid}>
              {dayTasks.map((task) => {
                const typeMeta = getTaskTypeMeta(task.taskType);
                const freqMeta = FREQUENCY_META[task.frequency] ?? FREQUENCY_META.one_time;
                const isExpanded = expandedId === task._id;
                const needsAttentionBanner = task.status === "rejected" || task.status === "changes_requested";
                const sColor = statusColor(task.status);
                const timeTaken = getTimeTakenLabel(task.startedAt, task.deliveredAt);
                const open = openChanges(task);

                return (
                  <div
                    key={task._id}
                    className={styles.taskCard}
                    style={{ borderTop: `3px solid ${sColor.color}` }}
                  >
                    <div className={styles.cardTop}>
                      <span className={styles.typeTag} style={{ background: typeMeta.bg, color: typeMeta.color }}>
                        {typeMeta.label}
                      </span>
                      <span className={styles.statusPill} style={{ background: sColor.bg, color: sColor.color }}>
                        {statusLabel(task.status)}
                      </span>
                    </div>

                    <h3 className={styles.taskTitle}>{task.title}</h3>
                    <p className={styles.taskDesc}>{task.description}</p>

                    <div className={styles.metaRow}>
                      <span className={styles.brandRow}>{getBrandName(task.brandId)}</span>
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
                      Due {task.dueDate || "—"}
                      <span className={styles.assignedBy}>
                        &middot; by {task.assignedBy === "super_admin" ? "Super Admin" : "Admin"}
                      </span>
                    </div>

                    {timeTaken && (
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                        ⏱ Time taken: <strong>{timeTaken}</strong>
                        {!task.deliveredAt && task.status === "in_progress" && " (running)"}
                      </div>
                    )}

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
                        onClick={() => setExpandedId(isExpanded ? null : task._id)}
                      >
                        <span className={styles.changeBubble}>{task.changes.length}</span>
                        Change Log {isExpanded ? "▲" : "▼"}
                      </button>
                    )}

                    {isExpanded && (
                      <div className={styles.changeList}>
                        {task.changes.map((ch) => (
                          <div key={ch._id} className={styles.changeItem}>
                            <div className={styles.changeTop}>
                              <span className={styles.changeBy}>{ch.changedBy}</span>
                              <span className={styles.changeDate}>{ch.changedAt}</span>
                              {ch.resolved && <span className={styles.resolvedBadge}>✓ Resolved</span>}
                            </div>
                            <p className={styles.changeNote}>{ch.note}</p>

                            {ch.employeeResponse && (
                              <div className={styles.smmResponse}>
                                <span className={styles.smmResponseLabel}>💬 Your Reply</span>
                                <p className={styles.smmResponseText}>{ch.employeeResponse}</p>
                              </div>
                            )}

                            {!ch.resolved && !ch.employeeResponse && (
                              <div className={styles.replyBox}>
                                <textarea
                                  className={styles.replyInput}
                                  rows={2}
                                  placeholder="Write your reply after making the fix…"
                                  value={replyDrafts[ch._id] ?? ""}
                                  onChange={(e) =>
                                    setReplyDrafts((prev) => ({ ...prev, [ch._id]: e.target.value }))
                                  }
                                />
                              </div>
                            )}
                          </div>
                        ))}

                        {open.length > 0 && (
                          <button
                            className={styles.replyBtn}
                            disabled={!allOpenRepliesFilled(task) || resubmitting === task._id}
                            onClick={() => handleResubmit(task)}
                            style={{ marginTop: 8, opacity: allOpenRepliesFilled(task) ? 1 : 0.5 }}
                          >
                            {resubmitting === task._id
                              ? "Resubmitting…"
                              : `Resubmit All Changes (${open.length})`}
                          </button>
                        )}
                      </div>
                    )}

                    <div className={styles.cardFooter}>
                      {task.status === "pending" && (
                        <button className={styles.actionBtn} onClick={() => onStartTask(task._id)}>
                          Start Task
                        </button>
                      )}
                      {task.status === "in_progress" && (
                        <button className={styles.actionBtn} onClick={() => openSubmitModal(task)}>
                          Submit for Review
                        </button>
                      )}
                      {(task.status === "rejected" || task.status === "changes_requested") && (
                        <span className={styles.waitingTag}>
                          {open.length > 0 ? "Reply to all notes above to resubmit" : "Ready to resubmit"}
                        </span>
                      )}
                      {task.status === "completed" && (
                        <span className={styles.waitingTag}>Awaiting Super Admin review</span>
                      )}
                      {task.status === "approved" && <span className={styles.doneTag}>✓ Approved</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* ── Submit for Review modal ── */}
      {submitModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => !submitting && setSubmitModal(null)}
        >
          <div
            style={{ background: "#fff", borderRadius: 12, padding: 24, width: 420, maxWidth: "90vw" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0, marginBottom: 4 }}>Submit for Review</h3>
            <p style={{ margin: 0, marginBottom: 12, color: "#64748b", fontSize: 13 }}>{submitModal.title}</p>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Note (optional)</label>
            <textarea
              rows={4}
              value={submitNote}
              onChange={(e) => setSubmitNote(e.target.value)}
              placeholder="Any notes for the reviewer, links, etc…"
              style={{
                width: "100%",
                marginTop: 4,
                marginBottom: 16,
                padding: 8,
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontFamily: "inherit",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={() => setSubmitModal(null)}
                disabled={submitting}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                disabled={submitting}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "#4338ca",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}