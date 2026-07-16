"use client";

import { useEffect, useState } from "react";
import { EditTask, WorkStatus, getTimeTakenLabel } from "@/types/photography/Photo";
import styles from "@/public/assets/styles/dashboard/photographer-dashboard/Editsboard.module.css";

interface EditsBoardProps {
  edits: EditTask[];
  onStart: (id: string) => Promise<void> | void;
  onProgressChange: (id: string, completedCount: number) => void;
  onSubmit: (id: string, note: string) => Promise<void> | void;
  onResubmit: (id: string, changeId: string, responseText: string) => void;
}

const statusLabel = (s: WorkStatus) => {
  if (s === "in_progress") return "In Progress";
  if (s === "approved") return "Approved";
  if (s === "completed") return "Submitted — In Review";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export default function EditsBoard({ edits, onStart, onProgressChange, onSubmit, onResubmit }: EditsBoardProps) {
  const [filter, setFilter] = useState<"all" | WorkStatus>("all");
  const [mediaFilter, setMediaFilter] = useState<"all" | "photo" | "video">("all");
  const [resubmitText, setResubmitText] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const [submitModal, setSubmitModal] = useState<EditTask | null>(null);
  const [submitNote, setSubmitNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Live timer refresh ──────────────────────────────────────────────
  const [, forceTick] = useState(0);
  useEffect(() => {
    const hasRunning = edits.some((e) => !!e.currentSessionStartedAt);
    if (!hasRunning) return;
    const id = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, [edits]);

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
    if (status === "completed" || status === "approved" || status === "rejected") return false;
    const today = new Date().toISOString().split("T")[0];
    return deadline < today;
  };

  const handleResubmitClick = (task: EditTask) => {
    const text = (resubmitText[task.id] ?? "").trim();
    if (!text || !task.openChange) return;
    onResubmit(task.id, task.openChange.id, text);
    setResubmitText((prev) => ({ ...prev, [task.id]: "" }));
  };

  const handleStartClick = async (id: string) => {
    setStarting(id);
    try {
      await onStart(id);
    } finally {
      setStarting(null);
    }
  };

  const openSubmitModal = (task: EditTask) => {
    setSubmitModal(task);
    setSubmitNote("");
  };

  const confirmSubmit = async () => {
    if (!submitModal) return;
    setSubmitting(true);
    try {
      await onSubmit(submitModal.id, submitNote.trim());
      setSubmitModal(null);
      setSubmitNote("");
    } finally {
      setSubmitting(false);
    }
  };

  const rejectedColors = { background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" };
  const approvedColors = { background: "#ecfeff", color: "#0e7490", border: "1px solid #a5f3fc" };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Edits</h2>
          <p className={styles.sub}>{edits.length} total &middot; photo + video edit queue</p>
        </div>
        <div className={styles.filterGroup}>
          <div className={styles.filterWrap}>
            {(["all", "pending", "in_progress", "completed", "approved", "rejected"] as const).map((f) => (
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
            const isRejected = task.status === "rejected";
            const isApproved = task.status === "approved";
            const needsCustomColor = isRejected || isApproved;
            const timeTaken = getTimeTakenLabel(task.startedAt, task.deliveredAt);
            const isRunning = !!task.currentSessionStartedAt;

            return (
              <div
                key={task.id}
                className={`${styles.editCard} ${needsCustomColor ? "" : styles[`border_${task.status}`] ?? ""}`}
                style={
                  isRejected
                    ? { borderColor: "#ef4444" }
                    : isApproved
                    ? { borderColor: "#0ea5e9" }
                    : undefined
                }
              >
                <div className={styles.cardTop}>
                  <span className={`${styles.mediaTag} ${styles[`media_${task.mediaType}`] ?? ""}`}>
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
                  <span
                    className={`${styles.statusPill} ${needsCustomColor ? "" : styles[`pill_${task.status}`] ?? ""}`}
                    style={isRejected ? rejectedColors : isApproved ? approvedColors : undefined}
                  >
                    {isApproved && "✓ "}
                    {statusLabel(task.status)}
                  </span>
                </div>

                <h3 className={styles.editTitle}>{task.title}</h3>

                <div className={styles.brandRow}>
                  <span className={styles.brandDot} style={{ background: task.brandColor }} />
                  <span className={styles.brandName}>{task.brand}</span>
                </div>

                <div className={styles.progressWrap}>
                  <div className={styles.progressBarBg}>
                    <div
                      className={`${styles.progressBarFill} ${needsCustomColor ? "" : styles[`fill_${task.status}`] ?? ""}`}
                      style={{
                        width: `${pct}%`,
                        ...(isRejected ? { background: "#ef4444" } : {}),
                        ...(isApproved ? { background: "#0ea5e9" } : {}),
                      }}
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

                {timeTaken && (
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                    ⏱ Time taken: <strong>{timeTaken}</strong>
                    {isRunning && <span style={{ color: "#1d4ed8" }}>(running)</span>}
                  </div>
                )}

                {task.changes.length > 0 && (
                  <div style={{ marginTop: "10px" }}>
                    <button
                      onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#374151",
                        background: "#f3f4f6",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        cursor: "pointer",
                        width: "100%",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        📝 Change History
                        <span
                          style={{
                            background: "#dc2626",
                            color: "#fff",
                            borderRadius: "999px",
                            fontSize: "10px",
                            padding: "1px 6px",
                            fontWeight: 700,
                          }}
                        >
                          {task.changes.length}
                        </span>
                      </span>
                      <span>{expandedId === task.id ? "▲" : "▼"}</span>
                    </button>

                    {expandedId === task.id && (
                      <div
                        style={{
                          marginTop: "6px",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          background: "#f9fafb",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {task.changes.map((c, idx) => (
                            <div
                              key={c.id}
                              style={{
                                fontSize: "12px",
                                paddingBottom: "8px",
                                borderBottom: idx < task.changes.length - 1 ? "1px solid #e5e7eb" : "none",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontWeight: 600, color: "#111827" }}>{c.changedBy}</span>
                                <span style={{ color: "#9ca3af", fontSize: "11px" }}>{c.changedAt}</span>
                              </div>
                              <p style={{ margin: "3px 0", color: "#4b5563" }}>{c.note}</p>
                              {c.employeeResponse && (
                                <p style={{ margin: "3px 0", color: "#1d4ed8" }}>
                                  <strong>Your response:</strong> {c.employeeResponse}
                                </p>
                              )}
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  color: c.resolved ? "#15803d" : "#b91c1c",
                                }}
                              >
                                {c.resolved ? "✓ Resolved" : "⚠ Awaiting your response"}
                              </span>
                            </div>
                          ))}
                        </div>

                        {task.openChange && !task.openChange.resolved && (
                          <div style={{ marginTop: "10px" }}>
                            <textarea
                              rows={2}
                              placeholder="Describe what you fixed, then resubmit…"
                              value={resubmitText[task.id] ?? ""}
                              onChange={(e) =>
                                setResubmitText((prev) => ({ ...prev, [task.id]: e.target.value }))
                              }
                              style={{
                                width: "100%",
                                fontSize: "13px",
                                padding: "6px 8px",
                                borderRadius: "6px",
                                border: "1px solid #fca5a5",
                                resize: "vertical",
                                boxSizing: "border-box",
                              }}
                            />
                            <button
                              onClick={() => handleResubmitClick(task)}
                              disabled={!(resubmitText[task.id] ?? "").trim()}
                              style={{
                                marginTop: "6px",
                                fontSize: "12px",
                                fontWeight: 600,
                                padding: "6px 12px",
                                borderRadius: "6px",
                                border: "none",
                                background: "#dc2626",
                                color: "#fff",
                                cursor: "pointer",
                                opacity: (resubmitText[task.id] ?? "").trim() ? 1 : 0.5,
                              }}
                            >
                              Resubmit
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Footer: pending -> Start; in_progress -> stepper +
                    Submit for Review; rejected -> Resume; approved -> badge. */}
                {task.status === "pending" && (
                  <div className={styles.cardFooter}>
                    <span />
                    <button
                      className={styles.markDoneBtn}
                      onClick={() => handleStartClick(task.id)}
                      disabled={starting === task.id}
                    >
                      {starting === task.id ? "Starting…" : "Start Editing"}
                    </button>
                  </div>
                )}

                {task.status === "in_progress" && (
                  <div className={styles.cardFooter}>
                    {task.mediaType === "photo" && task.totalCount > 1 ? (
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
                    <button className={styles.markDoneBtn} onClick={() => openSubmitModal(task)}>
                      Submit for Review
                    </button>
                  </div>
                )}

                {task.status === "completed" && (
                  <div className={styles.cardFooter}>
                    <span className={styles.assignedBy}>by {task.assignedBy}</span>
                    <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#a16207" }}>
                      Awaiting Super Admin review
                    </span>
                  </div>
                )}

                {isRejected && (
                  <div className={styles.cardFooter} style={{ flexWrap: "wrap", gap: 8 }}>
                    <span className={styles.assignedBy}>by {task.assignedBy}</span>
                    {!isRunning && (
                      <button
                        className={styles.markDoneBtn}
                        onClick={() => handleStartClick(task.id)}
                        disabled={starting === task.id}
                      >
                        {starting === task.id ? "Resuming…" : "Resume Task"}
                      </button>
                    )}
                    {isRunning && (
                      <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#1d4ed8" }}>
                        Timer running — resubmit when ready
                      </span>
                    )}
                  </div>
                )}

                {isApproved && (
                  <div className={styles.cardFooter}>
                    <span className={styles.assignedBy}>by {task.assignedBy}</span>
                    <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#0e7490" }}>
                      ✓ Approved by Admin
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
            <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Note for the reviewer</label>
            <textarea
              rows={4}
              value={submitNote}
              onChange={(e) => setSubmitNote(e.target.value)}
              placeholder="Any notes about the edit, links to files, etc…"
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