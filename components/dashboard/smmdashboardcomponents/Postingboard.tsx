"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RawTask,
  ContentType,
  CONTENT_TYPE_META,
  getBrandName,
  colorForBrand,
  getTimeTakenLabel,
  todayStr,
} from "@/types/smm/SMM";
import { BrandOption } from "@/app/api/Smmapi";
import styles from "@/public/assets/styles/dashboard/smmdashboard/Postingboard.module.css";

interface PostingBoardProps {
  entries: RawTask[]; // only taskType "post" | "video" | "story"
  brands: BrandOption[];
  onStartTask: (id: string) => void;
  onSubmitTask: (id: string, note: string) => void;
  onRespondChanges: (id: string, responses: { id: string; response: string }[]) => void;
}

const statusLabel = (s: RawTask["status"]) => {
  if (s === "in_progress") return "In Progress";
  if (s === "changes_requested") return "Changes Requested";
  if (s === "completed") return "Submitted — In Review";
  if (s === "approved") return "Approved";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const statusColor = (s: RawTask["status"]) => {
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

const shiftDate = (dateStr: string, days: number) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

export default function PostingBoard({
  entries,
  brands,
  onStartTask,
  onSubmitTask,
  onRespondChanges,
}: PostingBoardProps) {
  const today = todayStr();
  const [selectedDate, setSelectedDate] = useState(today);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [submitModal, setSubmitModal] = useState<RawTask | null>(null);
  const [submitNote, setSubmitNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resubmitting, setResubmitting] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);

  // ── Live timer refresh — same pattern as Smmtasksboard ──────────────
  const [, forceTick] = useState(0);
  useEffect(() => {
    const hasRunning = entries.some((e) => !!e.currentSessionStartedAt);
    if (!hasRunning) return;
    const id = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, [entries]);

  const dayEntries = useMemo(() => entries.filter((e) => e.dueDate === selectedDate), [entries, selectedDate]);

  const brandList = useMemo(() => {
    if (brands.length > 0) return brands.map((b) => ({ name: b.name, color: colorForBrand(b.name) }));
    const names = Array.from(new Set(entries.map((e) => getBrandName(e.brandId)).filter((n) => n !== "—")));
    return names.map((n) => ({ name: n, color: colorForBrand(n) }));
  }, [brands, entries]);

  const coverage = brandList.map((brand) => {
    const brandEntries = dayEntries.filter((e) => getBrandName(e.brandId) === brand.name);
    const slots: Record<ContentType, RawTask | null> = {
      post: brandEntries.find((e) => e.taskType === "post") ?? null,
      video: brandEntries.find((e) => e.taskType === "video") ?? null,
      story: brandEntries.find((e) => e.taskType === "story") ?? null,
    };
    return { brand, slots };
  });

  const scheduledCount = dayEntries.length;
  const completedCount = dayEntries.filter((e) => e.status === "completed" || e.status === "approved").length;
  const brandsWithActivity = coverage.filter((c) => c.slots.post || c.slots.video || c.slots.story).length;

  const openChanges = (entry: RawTask) => entry.changes.filter((c) => !c.resolved);

  const allOpenRepliesFilled = (entry: RawTask) => {
    const open = openChanges(entry);
    return open.length > 0 && open.every((c) => (replyDrafts[c._id] ?? "").trim().length > 0);
  };

  const handleResubmit = async (entry: RawTask) => {
    const responses = openChanges(entry).map((c) => ({
      id: c._id,
      response: (replyDrafts[c._id] ?? "").trim(),
    }));
    setResubmitting(entry._id);
    try {
      await onRespondChanges(entry._id, responses);
      setReplyDrafts((prev) => {
        const next = { ...prev };
        responses.forEach((r) => delete next[r.id]);
        return next;
      });
    } finally {
      setResubmitting(null);
    }
  };

  const handleStart = async (id: string) => {
    setStarting(id);
    try {
      await onStartTask(id);
    } finally {
      setStarting(null);
    }
  };

  const openSubmitModal = (entry: RawTask) => {
    setSubmitModal(entry);
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

  const dateLabelText = (dateStr: string) => {
    if (dateStr === today) return "Today";
    const t = shiftDate(today, 1);
    const y = shiftDate(today, -1);
    if (dateStr === t) return "Tomorrow";
    if (dateStr === y) return "Yesterday";
    return new Date(dateStr).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Posting Tracker</h2>
          <p className={styles.sub}>Brand-by-brand coverage — post, video &amp; story in one view</p>
        </div>

        <div className={styles.dateNav}>
          <button className={styles.navArrow} onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className={styles.dateDisplay}>
            <span className={styles.dateMain}>{dateLabelText(selectedDate)}</span>
            <input
              type="date"
              className={styles.dateInput}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <button className={styles.navArrow} onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          {selectedDate !== today && (
            <button className={styles.todayBtn} onClick={() => setSelectedDate(today)}>
              Today
            </button>
          )}
        </div>
      </div>

      <div className={styles.summaryStrip}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryValue}>
            {brandsWithActivity}/{brandList.length}
          </span>
          <span className={styles.summaryLabel}>Brands with activity</span>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <span className={styles.summaryValue}>
            {completedCount}/{scheduledCount}
          </span>
          <span className={styles.summaryLabel}>Content posted</span>
        </div>
      </div>

      {brandList.length === 0 ? (
        <div className={styles.summaryStrip} style={{ justifyContent: "center", color: "#64748b" }}>
          No brands found yet — ask your Super Admin to add one.
        </div>
      ) : (
        <div className={styles.brandGrid}>
          {coverage.map(({ brand, slots }) => {
            const anyActivity = slots.post || slots.video || slots.story;
            return (
              <div key={brand.name} className={styles.brandCard}>
                <div className={styles.brandHeader}>
                  <span className={styles.brandDot} style={{ background: brand.color }} />
                  <span className={styles.brandName}>{brand.name}</span>
                  {!anyActivity && <span className={styles.noneTag}>Nothing scheduled</span>}
                </div>

                <div className={styles.slotList}>
                  {(["post", "video", "story"] as ContentType[]).map((ct) => {
                    const entry = slots[ct];
                    const meta = CONTENT_TYPE_META[ct];

                    if (!entry) {
                      return (
                        <div key={ct} className={styles.slotEmpty}>
                          <span className={styles.slotIcon}>{meta.icon}</span>
                          <span className={styles.slotLabel}>{meta.label}</span>
                          <span className={styles.slotEmptyTag}>Not scheduled</span>
                        </div>
                      );
                    }

                    const isExpanded = expandedId === entry._id;
                    const needsAttention = entry.status === "rejected" || entry.status === "changes_requested";
                    const sColor = statusColor(entry.status);
                    const open = openChanges(entry);
                    // ── FIX: pause-aware accumulated time via timeSpentMs +
                    // currentSessionStartedAt — see getTimeTakenLabel's
                    // comment in types/smm/SMM.ts for why the old
                    // startedAt -> deliveredAt diff broke on reject/resume.
                    const timeTaken = getTimeTakenLabel(entry.timeSpentMs, entry.currentSessionStartedAt);
                    const isRunning = !!entry.currentSessionStartedAt;

                    return (
                      <div
                        key={entry._id}
                        className={styles.slotFilled}
                        style={{ borderLeft: `3px solid ${sColor.color}` }}
                      >
                        <div className={styles.slotTop}>
                          <span className={styles.slotIconTag} style={{ background: meta.bg, color: meta.color }}>
                            {meta.icon} {meta.label}
                          </span>
                          <span className={styles.statusPill} style={{ background: sColor.bg, color: sColor.color }}>
                            {statusLabel(entry.status)}
                          </span>
                        </div>

                        <p className={styles.slotTitle}>{entry.title}</p>
                        <span className={styles.slotAssignedBy}>
                          by {entry.assignedBy === "super_admin" ? "Super Admin" : "Admin"}
                        </span>

                        {timeTaken && (
                          <div style={{ fontSize: 11, color: "#64748b", margin: "2px 0" }}>
                            ⏱ {timeTaken}
                            {isRunning && <span style={{ color: "#1d4ed8" }}> (running)</span>}
                          </div>
                        )}

                        {needsAttention && entry.rejectRemark && (
                          <div className={styles.remarkBanner}>
                            <span className={styles.remarkIcon}>⚠️</span>
                            <p className={styles.remarkText}>{entry.rejectRemark}</p>
                          </div>
                        )}

                        {entry.changes.length > 0 && (
                          <button
                            className={`${styles.changeToggle} ${needsAttention ? styles.changeToggleAlert : ""}`}
                            onClick={() => setExpandedId(isExpanded ? null : entry._id)}
                          >
                            <span className={styles.changeBubble}>{entry.changes.length}</span>
                            Change Log {isExpanded ? "▲" : "▼"}
                          </button>
                        )}

                        {isExpanded && (
                          <div className={styles.changeList}>
                            {entry.changes.map((ch) => (
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
                                disabled={!allOpenRepliesFilled(entry) || resubmitting === entry._id}
                                onClick={() => handleResubmit(entry)}
                                style={{ opacity: allOpenRepliesFilled(entry) ? 1 : 0.5 }}
                              >
                                {resubmitting === entry._id ? "Resubmitting…" : `Resubmit (${open.length})`}
                              </button>
                            )}
                          </div>
                        )}

                        <div className={styles.slotFooter}>
                          {entry.status === "pending" && (
                            <button
                              className={styles.actionBtn}
                              onClick={() => handleStart(entry._id)}
                              disabled={starting === entry._id}
                            >
                              {starting === entry._id ? "Starting…" : "Start"}
                            </button>
                          )}
                          {entry.status === "in_progress" && (
                            <button className={styles.actionBtn} onClick={() => openSubmitModal(entry)}>
                              Mark Posted
                            </button>
                          )}
                          {/* ── Resume — hides once isRunning is true ── */}
                          {(entry.status === "rejected" || entry.status === "changes_requested") && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              {!isRunning && (
                                <button
                                  className={styles.actionBtn}
                                  onClick={() => handleStart(entry._id)}
                                  disabled={starting === entry._id}
                                >
                                  {starting === entry._id ? "Resuming…" : "Resume"}
                                </button>
                              )}
                              <span className={styles.waitingTag}>
                                {open.length > 0
                                  ? "Reply to resubmit"
                                  : isRunning
                                  ? "Timer running — resubmit when ready"
                                  : "Ready to repost"}
                              </span>
                            </div>
                          )}
                          {entry.status === "completed" && (
                            <span className={styles.waitingTag}>Awaiting review</span>
                          )}
                          {entry.status === "approved" && <span className={styles.doneTag}>✓ Approved</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
            <h3 style={{ margin: 0, marginBottom: 4 }}>Mark as Posted</h3>
            <p style={{ margin: 0, marginBottom: 12, color: "#64748b", fontSize: 13 }}>{submitModal.title}</p>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Note (optional)</label>
            <textarea
              rows={4}
              value={submitNote}
              onChange={(e) => setSubmitNote(e.target.value)}
              placeholder="Post link, caption notes, etc…"
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