"use client";

import { useMemo, useState } from "react";
import {
  PostingEntry,
  TaskStatus,
  ContentType,
  CONTENT_TYPE_META,
  BRANDS,
} from "@/types/smm/SMM";
import styles from "@/public/assets/styles/dashboard/smmdashboard/Postingboard.module.css";

interface PostingBoardProps {
  entries: PostingEntry[];
  onStatusChange: (id: string, status: TaskStatus) => void;
  onReplyToChange: (entryId: string, changeId: string, response: string) => void;
}

const statusLabel = (s: TaskStatus) => {
  if (s === "in_progress") return "In Progress";
  if (s === "changes_requested") return "Changes Requested";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const shiftDate = (dateStr: string, days: number) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

export default function PostingBoard({ entries, onStatusChange, onReplyToChange }: PostingBoardProps) {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const dayEntries = useMemo(
    () => entries.filter((e) => e.date === selectedDate),
    [entries, selectedDate]
  );

  const coverage = BRANDS.map((brand) => {
    const brandEntries = dayEntries.filter((e) => e.brand === brand.name);
    const slots: Record<ContentType, PostingEntry | null> = {
      post: brandEntries.find((e) => e.contentType === "post") ?? null,
      video: brandEntries.find((e) => e.contentType === "video") ?? null,
      story: brandEntries.find((e) => e.contentType === "story") ?? null,
    };
    return { brand, slots };
  });

  const scheduledCount = dayEntries.length;
  const completedCount = dayEntries.filter((e) => e.status === "completed").length;
  const brandsWithActivity = coverage.filter(
    (c) => c.slots.post || c.slots.video || c.slots.story
  ).length;

  const hasUnresolvedChanges = (entry: PostingEntry) => entry.changes.some((c) => !c.resolved);

  const sendReply = (entry: PostingEntry, changeId: string) => {
    const text = replyDrafts[changeId] ?? "";
    if (!text.trim()) return;
    onReplyToChange(entry.id, changeId, text.trim());
    setReplyDrafts((prev) => ({ ...prev, [changeId]: "" }));
  };

  const cycleAction = (entry: PostingEntry): { label: string; next: TaskStatus } | null => {
    if (entry.status === "pending") return { label: "Start", next: "in_progress" };
    if (entry.status === "in_progress") return { label: "Mark Posted", next: "completed" };
    if ((entry.status === "rejected" || entry.status === "changes_requested") && !hasUnresolvedChanges(entry)) {
      return { label: "Repost", next: "completed" };
    }
    return null;
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

      {/* ── Coverage summary strip ── */}
      <div className={styles.summaryStrip}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryValue}>{brandsWithActivity}/{BRANDS.length}</span>
          <span className={styles.summaryLabel}>Brands with activity</span>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <span className={styles.summaryValue}>{completedCount}/{scheduledCount}</span>
          <span className={styles.summaryLabel}>Content posted</span>
        </div>
      </div>

      {/* ── Brand coverage grid ── */}
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

                  const isExpanded = expandedId === entry.id;
                  const needsAttention = entry.status === "rejected" || entry.status === "changes_requested";
                  const action = cycleAction(entry);

                  return (
                    <div key={entry.id} className={`${styles.slotFilled} ${styles[`slotBorder_${entry.status}`]}`}>
                      <div className={styles.slotTop}>
                        <span className={styles.slotIconTag} style={{ background: meta.bg, color: meta.color }}>
                          {meta.icon} {meta.label}
                        </span>
                        <span className={`${styles.statusPill} ${styles[`pill_${entry.status}`]}`}>
                          {statusLabel(entry.status)}
                        </span>
                      </div>

                      <p className={styles.slotTitle}>{entry.title}</p>
                      <span className={styles.slotAssignedBy}>by {entry.assignedBy}</span>

                      {needsAttention && entry.rejectRemark && (
                        <div className={styles.remarkBanner}>
                          <span className={styles.remarkIcon}>⚠️</span>
                          <p className={styles.remarkText}>{entry.rejectRemark}</p>
                        </div>
                      )}

                      {entry.changes.length > 0 && (
                        <button
                          className={`${styles.changeToggle} ${needsAttention ? styles.changeToggleAlert : ""}`}
                          onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        >
                          <span className={styles.changeBubble}>{entry.changes.length}</span>
                          Change Log {isExpanded ? "▲" : "▼"}
                        </button>
                      )}

                      {isExpanded && (
                        <div className={styles.changeList}>
                          {entry.changes.map((ch) => (
                            <div key={ch.id} className={styles.changeItem}>
                              <div className={styles.changeTop}>
                                <span className={styles.changeBy}>{ch.changedBy}</span>
                                <span className={styles.changeDate}>{ch.changedAt}</span>
                                {ch.resolved && <span className={styles.resolvedBadge}>✓ Resolved</span>}
                              </div>
                              <p className={styles.changeNote}>{ch.note}</p>

                              {ch.smmResponse && (
                                <div className={styles.smmResponse}>
                                  <span className={styles.smmResponseLabel}>💬 Your Reply</span>
                                  <p className={styles.smmResponseText}>{ch.smmResponse}</p>
                                </div>
                              )}

                              {!ch.resolved && !ch.smmResponse && (
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
                                  <button className={styles.replyBtn} onClick={() => sendReply(entry, ch.id)}>
                                    Send Reply
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className={styles.slotFooter}>
                        {action ? (
                          <button
                            className={`${styles.actionBtn} ${styles[`action_${entry.status}`]}`}
                            onClick={() => onStatusChange(entry.id, action.next)}
                          >
                            {action.label}
                          </button>
                        ) : entry.status === "completed" ? (
                          <span className={styles.doneTag}>✓ Posted</span>
                        ) : (
                          <span className={styles.waitingTag}>Reply to resubmit</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}