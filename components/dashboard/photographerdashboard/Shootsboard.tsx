"use client";

import { useEffect, useMemo, useState } from "react";
import { Shoot, WorkStatus, getTimeTakenLabel } from "@/types/photography/Photo";
import styles from "@/public/assets/styles/dashboard/photographer-dashboard/Shootsboard.module.css";

interface ShootsBoardProps {
  shoots: Shoot[];
  onStart: (id: string) => Promise<void> | void;
  onSubmit: (id: string, note: string) => Promise<void> | void;
  onResubmit: (id: string, changeId: string, responseText: string) => void;
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

const statusLabel = (s: WorkStatus) => {
  if (s === "in_progress") return "In Progress";
  if (s === "approved") return "Approved";
  if (s === "completed") return "Submitted — In Review";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

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

export default function ShootsBoard({ shoots, onStart, onSubmit, onResubmit }: ShootsBoardProps) {
  const [filter, setFilter] = useState<"all" | WorkStatus>("all");
  const [resubmitText, setResubmitText] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const [submitModal, setSubmitModal] = useState<Shoot | null>(null);
  const [submitNote, setSubmitNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const tmrDate = new Date();
  tmrDate.setDate(tmrDate.getDate() + 1);
  const tomorrow = tmrDate.toISOString().split("T")[0];
  const ystDate = new Date();
  ystDate.setDate(ystDate.getDate() - 1);
  const yesterday = ystDate.toISOString().split("T")[0];

  // ── Live timer refresh — any shoot whose clock is currently running
  // needs a re-render every 30s so "time taken" keeps ticking up. ──────
  const [, forceTick] = useState(0);
  useEffect(() => {
    const hasRunning = shoots.some((s) => !!s.currentSessionStartedAt);
    if (!hasRunning) return;
    const id = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, [shoots]);

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

  const handleResubmitClick = (shoot: Shoot) => {
    const text = (resubmitText[shoot.id] ?? "").trim();
    if (!text || !shoot.openChange) return;
    onResubmit(shoot.id, shoot.openChange.id, text);
    setResubmitText((prev) => ({ ...prev, [shoot.id]: "" }));
  };

  const handleStartClick = async (id: string) => {
    setStarting(id);
    try {
      await onStart(id);
    } finally {
      setStarting(null);
    }
  };

  const openSubmitModal = (shoot: Shoot) => {
    setSubmitModal(shoot);
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
          <h2 className={styles.title}>Shoots</h2>
          <p className={styles.sub}>{shoots.length} total &middot; assigned by admin / super admin</p>
        </div>
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
              {dayShoots.map((shoot) => {
                const isRejected = shoot.status === "rejected";
                const isApproved = shoot.status === "approved";
                const needsCustomColor = isRejected || isApproved;
                const timeTaken = getTimeTakenLabel(shoot.startedAt, shoot.deliveredAt);
                const isRunning = !!shoot.currentSessionStartedAt;

                return (
                  <div
                    key={shoot.id}
                    className={`${styles.shootCard} ${needsCustomColor ? "" : styles[`border_${shoot.status}`] ?? ""}`}
                    style={
                      isRejected
                        ? { borderColor: "#ef4444" }
                        : isApproved
                        ? { borderColor: "#0ea5e9" }
                        : undefined
                    }
                  >
                    <div className={styles.cardTop}>
                      <span className={styles.time}>{shoot.time}</span>
                      <span
                        className={`${styles.statusPill} ${needsCustomColor ? "" : styles[`pill_${shoot.status}`] ?? ""}`}
                        style={isRejected ? rejectedColors : isApproved ? approvedColors : undefined}
                      >
                        {isApproved && "✓ "}
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

                    {timeTaken && (
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                        ⏱ Time taken: <strong>{timeTaken}</strong>
                        {isRunning && <span style={{ color: "#1d4ed8" }}>(running)</span>}
                      </div>
                    )}

                    {shoot.notes && <p className={styles.notes}>📝 {shoot.notes}</p>}

                    {shoot.changes.length > 0 && (
                      <div style={{ marginTop: "10px" }}>
                        <button
                          onClick={() => setExpandedId(expandedId === shoot.id ? null : shoot.id)}
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
                              {shoot.changes.length}
                            </span>
                          </span>
                          <span>{expandedId === shoot.id ? "▲" : "▼"}</span>
                        </button>

                        {expandedId === shoot.id && (
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
                              {shoot.changes.map((c, idx) => (
                                <div
                                  key={c.id}
                                  style={{
                                    fontSize: "12px",
                                    paddingBottom: "8px",
                                    borderBottom: idx < shoot.changes.length - 1 ? "1px solid #e5e7eb" : "none",
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

                            {shoot.openChange && !shoot.openChange.resolved && (
                              <div style={{ marginTop: "10px" }}>
                                <textarea
                                  rows={2}
                                  placeholder="Describe what you fixed, then resubmit…"
                                  value={resubmitText[shoot.id] ?? ""}
                                  onChange={(e) =>
                                    setResubmitText((prev) => ({ ...prev, [shoot.id]: e.target.value }))
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
                                  onClick={() => handleResubmitClick(shoot)}
                                  disabled={!(resubmitText[shoot.id] ?? "").trim()}
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
                                    opacity: (resubmitText[shoot.id] ?? "").trim() ? 1 : 0.5,
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

                    {/* ── Footer: pending -> Start; in_progress -> Submit for
                        Review (opens note modal); rejected -> Resume Task
                        (hides once timer running); approved -> badge. ── */}
                    {shoot.status === "pending" && (
                      <div className={styles.cardFooter}>
                        <span className={styles.assignedBy}>Assigned by {shoot.assignedBy}</span>
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleStartClick(shoot.id)}
                          disabled={starting === shoot.id}
                        >
                          {starting === shoot.id ? "Starting…" : "Start Shoot"}
                        </button>
                      </div>
                    )}

                    {shoot.status === "in_progress" && (
                      <div className={styles.cardFooter}>
                        <span className={styles.assignedBy}>Assigned by {shoot.assignedBy}</span>
                        <button className={styles.actionBtn} onClick={() => openSubmitModal(shoot)}>
                          Submit for Review
                        </button>
                      </div>
                    )}

                    {shoot.status === "completed" && (
                      <div className={styles.cardFooter}>
                        <span className={styles.assignedBy}>Assigned by {shoot.assignedBy}</span>
                        <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#a16207" }}>
                          Awaiting Super Admin review
                        </span>
                      </div>
                    )}

                    {isRejected && (
                      <div className={styles.cardFooter} style={{ flexWrap: "wrap", gap: 8 }}>
                        <span className={styles.assignedBy}>Assigned by {shoot.assignedBy}</span>
                        {!isRunning && (
                          <button
                            className={styles.actionBtn}
                            onClick={() => handleStartClick(shoot.id)}
                            disabled={starting === shoot.id}
                          >
                            {starting === shoot.id ? "Resuming…" : "Resume Task"}
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
                        <span className={styles.assignedBy}>Assigned by {shoot.assignedBy}</span>
                        <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#0e7490" }}>
                          ✓ Approved by Admin
                        </span>
                      </div>
                    )}
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
            <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Note for the reviewer</label>
            <textarea
              rows={4}
              value={submitNote}
              onChange={(e) => setSubmitNote(e.target.value)}
              placeholder="What was shot, any issues, links to files, etc…"
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