"use client";

import { useMemo, useState } from "react";
import api from "@/lib/api";
import { Task, TaskStatus, TaskFrequency, Brand } from "@/types/admin/Crm";
import styles from "@/public/assets/styles/dashboard/admindashboard/Adminselftasksboard.module.css";

interface AdminSelfTasksBoardProps {
  tasks: Task[]; // already filtered to this admin's self-assigned tasks
  brands: Brand[];
  onRefresh: () => void;
}

const statusLabel = (s: string) => {
  if (s === "in_progress") return "In Progress";
  if (s === "changes_requested") return "Changes Requested";
  if (s === "completed") return "Submitted — In Review";
  if (s === "approved") return "Approved";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const statusColor = (s: string) => {
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

const freqMeta: Record<TaskFrequency, { label: string; bg: string; color: string }> = {
  weekly: { label: "Weekly", bg: "#eef2ff", color: "#4338ca" },
  monthly: { label: "Monthly", bg: "#fdf2f8", color: "#be185d" },
  one_time: { label: "One Time", bg: "#f0fdfa", color: "#0f766e" },
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

// ── Time-taken helper ────────────────────────────────────────────────────
// THE FIX: this used to compute a raw startedAt -> deliveredAt wall-clock
// diff, same as SATasks originally did. That formula breaks the moment a
// task goes through a reject -> Resume cycle: the backend's startTask()
// intentionally clears deliveredAt on resume (so the OLD delivered
// timestamp doesn't get read as an "end" for the timeSpentMs-based
// formula), which meant this diff fell back to (now - startedAt) — the
// task's ORIGINAL start time, ignoring any time spent paused waiting on
// the rejection. The backend already tracks the correct, pause-aware
// total in timeSpentMs (accumulated on every stopTimer() call) plus
// whatever the currently-running session has added
// (currentSessionStartedAt). This is the same formula the Designer
// Dashboard and Super Admin's SATasks now use, so every dashboard agrees.
const getTimeTakenLabel = (
  timeSpentMs?: number | null,
  currentSessionStartedAt?: string | null
): string | null => {
  let totalMs = timeSpentMs || 0;

  if (currentSessionStartedAt) {
    const elapsed = Date.now() - new Date(currentSessionStartedAt).getTime();
    if (elapsed > 0) totalMs += elapsed;
  }

  if (totalMs <= 0) return null;

  const mins = Math.floor(totalMs / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ${hrs % 24}h`;
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  return `${mins}m`;
};

export default function AdminSelfTasksBoard({ tasks, brands, onRefresh }: AdminSelfTasksBoardProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [submitModal, setSubmitModal] = useState<Task | null>(null);
  const [submitNote, setSubmitNote] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const getBrandName = (brandId?: string | { _id: string; name: string } | null) => {
    if (!brandId) return "No brand";
    if (typeof brandId === "object") return brandId.name;
    return brands.find((b) => b._id === brandId)?.name ?? "No brand";
  };

  const filtered = useMemo(
    () => (statusFilter === "all" ? tasks : tasks.filter((t) => t.status === statusFilter)),
    [tasks, statusFilter]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    [...filtered]
      .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
      .forEach((t) => {
        const key = t.dueDate || "No due date";
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(t);
      });
    return Array.from(map.entries());
  }, [filtered]);

  const openChanges = (task: Task) => task.changes.filter((c) => !c.resolved);

  const allOpenRepliesFilled = (task: Task) => {
    const open = openChanges(task);
    return open.length > 0 && open.every((c) => (replyDrafts[c._id] ?? "").trim().length > 0);
  };

  // ── Start Task: stamps startedAt via the same status-update endpoint
  // every other dashboard uses (PUT /tasks/:id). ────────────────────────
  const handleStartTask = async (task: Task) => {
    try {
      setBusyId(task._id);
      await api.put(`/tasks/${task._id}`, { status: "in_progress" });
      onRefresh();
    } catch (err) {
      console.error("Start task failed", err);
    } finally {
      setBusyId(null);
    }
  };

  const openSubmitModal = (task: Task) => {
    setSubmitModal(task);
    setSubmitNote("");
  };

  const confirmSubmit = async () => {
    if (!submitModal) return;
    try {
      setBusyId(submitModal._id);
      await api.post(`/tasks/${submitModal._id}/submit`, {
        deliveryState: "delivered",
        deliveryNote: submitNote.trim(),
      });
      setSubmitModal(null);
      setSubmitNote("");
      onRefresh();
    } catch (err) {
      console.error("Submit task failed", err);
    } finally {
      setBusyId(null);
    }
  };

  const handleResubmit = async (task: Task) => {
    const responses = openChanges(task).map((c) => ({
      id: c._id,
      response: (replyDrafts[c._id] ?? "").trim(),
    }));
    try {
      setBusyId(task._id);
      await api.post(`/tasks/${task._id}/respond`, { responses });
      setReplyDrafts((prev) => {
        const next = { ...prev };
        responses.forEach((r) => delete next[r.id]);
        return next;
      });
      onRefresh();
    } catch (err) {
      console.error("Resubmit failed", err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>My Tasks</h2>
          <p className={styles.sub}>Work you've assigned to yourself</p>
        </div>
        <div className={styles.filterWrap}>
          {(["all", "pending", "in_progress", "changes_requested", "rejected", "completed", "approved"] as const).map(
            (f) => (
              <button
                key={f}
                className={`${styles.filterBtn} ${statusFilter === f ? styles.filterActive : ""}`}
                onClick={() => setStatusFilter(f)}
              >
                {f === "all" ? "All" : statusLabel(f)}
              </button>
            )
          )}
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🗂️</div>
          <p>No self-assigned tasks yet. Use "Assign to Myself" in Assign Task to add one.</p>
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
                const isExpanded = expandedId === task._id;
                const needsAttentionBanner = task.status === "rejected" || task.status === "changes_requested";
                const sColor = statusColor(task.status);
                const fMeta = freqMeta[task.frequency] ?? freqMeta.one_time;
                // Same fields the Designer Dashboard / SATasks read — see
                // getTimeTakenLabel's comment above for why startedAt/
                // deliveredAt alone aren't reliable across a reject/resume.
                const taskAny = task as unknown as {
                  timeSpentMs?: number;
                  currentSessionStartedAt?: string | null;
                };
                const timeTaken = getTimeTakenLabel(taskAny.timeSpentMs, taskAny.currentSessionStartedAt);
                const isRunning = !!taskAny.currentSessionStartedAt;
                const open = openChanges(task);
                const isBusy = busyId === task._id;

                return (
                  <div key={task._id} className={styles.taskCard} style={{ borderTop: `3px solid ${sColor.color}` }}>
                    <div className={styles.cardTop}>
                      <span className={styles.statusPill} style={{ background: sColor.bg, color: sColor.color }}>
                        {statusLabel(task.status)}
                      </span>
                      <span className={styles.freqTag} style={{ background: fMeta.bg, color: fMeta.color }}>
                        {fMeta.label}
                      </span>
                    </div>

                    <h3 className={styles.taskTitle}>{task.title}</h3>
                    {task.description && <p className={styles.taskDesc}>{task.description}</p>}

                    <div className={styles.metaRow}>
                      <span className={styles.brandRow}>{getBrandName(task.brandId)}</span>
                    </div>

                    <div className={styles.dueRow}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Due {task.dueDate || "—"}
                    </div>

                    {timeTaken && (
                      <div className={styles.timeRow}>
                        ⏱ Time taken: <strong>{timeTaken}</strong>
                        {isRunning && " (running)"}
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
                        Review Log {isExpanded ? "▲" : "▼"}
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
                              <div className={styles.myResponse}>
                                <span className={styles.myResponseLabel}>💬 Your Reply</span>
                                <p className={styles.myResponseText}>{ch.employeeResponse}</p>
                              </div>
                            )}

                            {!ch.resolved && !ch.employeeResponse && (
                              <div className={styles.replyBox}>
                                <textarea
                                  className={styles.replyInput}
                                  rows={2}
                                  placeholder="Write your reply after making the fix…"
                                  value={replyDrafts[ch._id] ?? ""}
                                  onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [ch._id]: e.target.value }))}
                                />
                              </div>
                            )}
                          </div>
                        ))}

                        {open.length > 0 && (
                          <button
                            className={styles.replyBtn}
                            disabled={!allOpenRepliesFilled(task) || isBusy}
                            onClick={() => handleResubmit(task)}
                          >
                            {isBusy ? "Resubmitting…" : `Resubmit All Changes (${open.length})`}
                          </button>
                        )}
                      </div>
                    )}

                    <div className={styles.cardFooter}>
                      {task.status === "pending" && (
                        <button className={styles.actionBtn} onClick={() => handleStartTask(task)} disabled={isBusy}>
                          {isBusy ? "Starting…" : "Start Task"}
                        </button>
                      )}
                      {task.status === "in_progress" && (
                        <button className={styles.actionBtn} onClick={() => openSubmitModal(task)} disabled={isBusy}>
                          Submit for Review
                        </button>
                      )}
                      {(task.status === "rejected" || task.status === "changes_requested") && (
                        <span className={styles.waitingTag}>
                          {open.length > 0 ? "Reply to all notes above to resubmit" : "Ready to resubmit"}
                        </span>
                      )}
                      {task.status === "completed" && <span className={styles.waitingTag}>Awaiting review</span>}
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
        <div className={styles.modalOverlay} onClick={() => !busyId && setSubmitModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Submit for Review</h3>
            <p className={styles.modalSub}>{submitModal.title}</p>
            <label className={styles.modalLabel}>Note (optional)</label>
            <textarea
              rows={4}
              className={styles.modalTextarea}
              value={submitNote}
              onChange={(e) => setSubmitNote(e.target.value)}
              placeholder="Any notes, links, or context…"
            />
            <div className={styles.modalActions}>
              <button
                className={styles.modalCancelBtn}
                onClick={() => setSubmitModal(null)}
                disabled={busyId === submitModal._id}
              >
                Cancel
              </button>
              <button
                className={styles.modalSubmitBtn}
                onClick={confirmSubmit}
                disabled={busyId === submitModal._id}
              >
                {busyId === submitModal._id ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}