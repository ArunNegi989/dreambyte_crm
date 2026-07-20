"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Task, TaskStatus, CATEGORY_META, TaskDetails, getTimeTakenLabel } from '../../../types/seodashboard/task';
import { CATEGORY_FIELD_CONFIG, FieldDef } from './taskFieldConfig';
import DynamicField from './DynamicField';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import RankChip from './RankChip';
import { respondToTaskChange } from '../../../app/api/seoApi';
import styles from '../../../assets/styles/seodashboard/TaskModal.module.css';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  // Starts (or resumes) the work timer. Backend flips pending -> in_progress
  // on a fresh start, and leaves status as-is on a resume from rejected (so
  // the feedback/reply section below keeps showing until actually
  // resubmitted). Parent refetches after this resolves.
  onStart: (taskId: string) => Promise<void> | void;
  // Submits the task for review: saves whatever category detail fields were
  // filled in, stops the timer, and moves status -> completed.
  onSubmit: (taskId: string, remarks: string, details: TaskDetails) => Promise<void> | void;
  onRespond?: () => void; // optional: lets the parent page refetch after a reply is sent
}

function emptyRow(fields: FieldDef[]): Record<string, any> {
  const row: Record<string, any> = { id: `row_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` };
  fields.forEach((f) => {
    row[f.name] = f.type === 'multiselect' ? [] : '';
  });
  return row;
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(value?: string | null): string {
  if (!value) return '';
  return new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function isAdminAuthor(changedBy: string): boolean {
  return changedBy.toLowerCase().includes('admin');
}

export default function TaskModal({ task, onClose, onStart, onSubmit, onRespond }: TaskModalProps) {
  const config = CATEGORY_FIELD_CONFIG[task.category];
  const meta = CATEGORY_META[task.category];

  const [remarks, setRemarks] = useState(task.remarks || '');
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [timerError, setTimerError] = useState('');

  const initialDetail = (task.details as any)?.[task.category];
  const [singleDetail, setSingleDetail] = useState<Record<string, any>>(
    !config.isList ? (initialDetail || {}) : {}
  );
  const [rows, setRows] = useState<Record<string, any>[]>(
    config.isList ? (Array.isArray(initialDetail) ? initialDetail : []) : []
  );

  // Ticks every 30s so a running timer's label stays live while the modal
  // is open — same pattern as every other dashboard's task modal.
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!task.currentSessionStartedAt) return;
    const id = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, [task.currentSessionStartedAt]);

  // ── Pause-aware time taken — see getTimeTakenLabel's comment in task.ts
  // for why this reads timeSpentMs + currentSessionStartedAt instead of
  // startedAt/deliveredAt directly.
  const timeTaken = getTimeTakenLabel(task.timeSpentMs, task.currentSessionStartedAt);
  const isRunning = !!task.currentSessionStartedAt;

  const FINAL_STATUSES: TaskStatus[] = ['completed'];
  const isEditable = !FINAL_STATUSES.includes(task.status);
  const isNeverStarted = task.status === 'pending' && !task.currentSessionStartedAt && !task.timeSpentMs;
  const isRejected = task.status === 'rejected';
  const isBlocked = task.status === 'blocked';

  // ── Admin feedback ──────────────────────────────────────────────────────
  const adminFeedback = useMemo(() => {
    const changeEntries = task.changes ?? [];
    const adminChanges = changeEntries.filter((c) => isAdminAuthor(c.changedBy));

    const hasMatchingChange = adminChanges.some((c) => c.note === task.rejectRemark);
    const fallback =
      task.status === 'rejected' && task.rejectRemark && !hasMatchingChange
        ? [{
            id: null as string | null,
            changedBy: 'Admin',
            note: task.rejectRemark,
            changedAt: task.submittedAt || '',
            resolved: false,
            employeeResponse: '',
          }]
        : [];

    return [...adminChanges, ...fallback].sort((a, b) => b.changedAt.localeCompare(a.changedAt));
  }, [task]);

  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [locallyReplied, setLocallyReplied] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState<string | null>(null);

  const handleReply = async (changeId: string) => {
    const text = (replyDrafts[changeId] || '').trim();
    if (!text) return;
    try {
      setReplying(changeId);
      await respondToTaskChange(task.id, changeId, text);
      setLocallyReplied((prev) => ({ ...prev, [changeId]: text }));
      setReplyDrafts((prev) => ({ ...prev, [changeId]: '' }));
      onRespond?.();
    } catch (err) {
      console.error('Failed to send reply', err);
    } finally {
      setReplying(null);
    }
  };

  const overdue = useMemo(
    () => task.status !== 'completed' && task.dueDate < new Date().toISOString().slice(0, 10),
    [task]
  );

  const updateSingleField = (name: string, value: any) => {
    setSingleDetail((prev) => ({ ...prev, [name]: value }));
  };

  const updateRowField = (rowId: string, name: string, value: any) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [name]: value } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow(config.fields)]);
  const removeRow = (rowId: string) => setRows((prev) => prev.filter((r) => r.id !== rowId));

  // ── Start Task — hits the dedicated timer endpoint (via parent's onStart)
  // rather than a plain status update, so currentSessionStartedAt actually
  // gets stamped server-side. Used for both a fresh start (pending) and a
  // resume (rejected, timer not already running).
  const handleStart = async () => {
    try {
      setStarting(true);
      setTimerError('');
      await onStart(task.id);
      onClose();
    } catch (err) {
      setTimerError(err instanceof Error ? err.message : 'Failed to start task');
    } finally {
      setStarting(false);
    }
  };

  // ── Submit for Review — stops the timer, saves the category fields, and
  // moves status -> completed. This replaces the old free-form status
  // dropdown entirely: submitting always means "done, sent for review."
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const details: TaskDetails = { [task.category]: config.isList ? rows : singleDetail } as TaskDetails;
      await onSubmit(task.id, remarks, details);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <span className={styles.categoryTag}>{meta.label}</span>
            <h2 className={styles.title}>{task.title}</h2>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.description}>{task.description}</p>

          {adminFeedback.length > 0 && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: 10,
                padding: '0.85rem 1rem',
                margin: '0.75rem 0 1rem',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#991b1b', marginBottom: '0.5rem' }}>
                ⚠️ Feedback from admin
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {adminFeedback.map((c) => {
                  const key = c.id ?? `legacy_${c.changedAt}`;
                  const employeeResponse = c.employeeResponse || (c.id ? locallyReplied[c.id] : '') || '';
                  const resolved = c.resolved || (c.id ? !!locallyReplied[c.id] : false);

                  return (
                    <div
                      key={key}
                      style={{
                        background: 'white',
                        border: '1px solid #fecaca',
                        borderRadius: 8,
                        padding: '0.6rem 0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          {c.changedBy}{c.changedAt ? ` · ${formatDateTime(c.changedAt)}` : ''}
                        </span>
                        {resolved && (
                          <span style={{ fontSize: '0.68rem', background: '#dcfce7', color: '#166534', padding: '0.1rem 0.5rem', borderRadius: 999 }}>
                            Resolved
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '0.35rem 0', fontSize: '0.85rem', color: '#374151' }}>{c.note}</p>

                      {employeeResponse ? (
                        <div style={{ background: '#f9fafb', borderRadius: 6, padding: '0.4rem 0.6rem', marginTop: '0.35rem' }}>
                          <span style={{ fontSize: '0.68rem', color: '#6b7280', fontWeight: 600 }}>Your reply</span>
                          <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem' }}>{employeeResponse}</p>
                        </div>
                      ) : c.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                          <input
                            style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 6, padding: '0.35rem 0.55rem', fontSize: '0.82rem' }}
                            placeholder="Write a reply…"
                            value={replyDrafts[c.id] || ''}
                            onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [c.id as string]: e.target.value }))}
                          />
                          {/* <button
                            type="button"
                            onClick={() => handleReply(c.id as string)}
                            disabled={replying === c.id}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: 6,
                              padding: '0.35rem 0.8rem',
                              fontSize: '0.78rem',
                              cursor: replying === c.id ? 'not-allowed' : 'pointer',
                              opacity: replying === c.id ? 0.6 : 1,
                            }}
                          >
                            {replying === c.id ? 'Sending…' : 'Reply'}
                          </button> */}
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.72rem', color: '#9ca3af', fontStyle: 'italic', margin: '0.35rem 0 0' }}>
                          Recorded before reply support — resume and resubmit below to resolve.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Client / Brand</span>
              <span className={styles.metaValue}>{task.brandName} · {task.clientName}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Assigned</span>
              <span className={styles.metaValue}>{formatDate(task.assignedDate)}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Due date</span>
              <span className={`${styles.metaValue} ${overdue ? styles.overdueText : ''}`}>
                {formatDate(task.dueDate)}{overdue ? ' (overdue)' : ''}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Priority</span>
              <PriorityBadge priority={task.priority} />
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Current status</span>
              <StatusBadge status={task.status} />
            </div>
            {timeTaken && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Time taken</span>
                <span className={styles.metaValue}>
                  {timeTaken}{isRunning ? ' (running)' : ''}
                </span>
              </div>
            )}
          </div>

          {/* ── Start Task — shown only before work has ever begun. No
              status dropdown anymore: the backend stamps everything the
              moment this is clicked, same as every other dashboard. ── */}
          {isNeverStarted && (
            <div style={{ margin: '16px 0' }}>
              <button type="button" className={styles.saveBtn} onClick={handleStart} disabled={starting}>
                {starting ? 'Starting…' : 'Start Task'}
              </button>
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Clicking this starts the work timer.</p>
            </div>
          )}

          {/* ── Resume Task — shown when rejected and the timer isn't
              already running. Restarts the clock; status stays untouched
              so the feedback above keeps showing until actually
              resubmitted via the reply boxes or the Submit button. ── */}
          {isRejected && !isRunning && (
            <div style={{ margin: '16px 0' }}>
              <button type="button" className={styles.saveBtn} onClick={handleStart} disabled={starting}>
                {starting ? 'Resuming…' : 'Resume Task'}
              </button>
            </div>
          )}

          {timerError && (
            <p style={{ color: '#a32d2d', fontSize: 12.5, marginTop: 6 }}>{timerError}</p>
          )}

          <hr className={styles.divider} />

          <h3 className={styles.sectionTitle}>{meta.label} details</h3>

          {config.isList ? (
            <div className={styles.rowsWrap}>
              {rows.length === 0 && <p className={styles.emptyRows}>{config.emptyRowLabel}</p>}

              {rows.map((row, idx) => (
                <div key={row.id} className={styles.rowCard}>
                  <div className={styles.rowCardHeader}>
                    <span className={styles.rowIndex}>#{idx + 1}</span>
                    {task.category === 'website_ranking' && (
                      <RankChip previousRank={row.previousRank} currentRank={row.currentRank} />
                    )}
                    {isEditable && (
                      <button type="button" className={styles.removeRowBtn} onClick={() => removeRow(row.id)}>
                        Remove
                      </button>
                    )}
                  </div>
                  <div className={styles.fieldGrid}>
                    {config.fields.map((field) => (
                      <div key={field.name} className={styles.field}>
                        <label className={styles.fieldLabel}>{field.label}</label>
                        <DynamicField
                          field={field}
                          value={row[field.name]}
                          onChange={(value) => updateRowField(row.id, field.name, value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {isEditable && (
                <button type="button" className={styles.addRowBtn} onClick={addRow}>
                  + {config.addLabel}
                </button>
              )}
            </div>
          ) : (
            <div className={styles.fieldGrid}>
              {config.fields.map((field) => (
                <div key={field.name} className={styles.field}>
                  <label className={styles.fieldLabel}>{field.label}</label>
                  <DynamicField
                    field={field}
                    value={singleDetail[field.name]}
                    onChange={(value) => updateSingleField(field.name, value)}
                  />
                </div>
              ))}
            </div>
          )}

          {isEditable && (
            <>
              <hr className={styles.divider} />
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Remarks (optional)</label>
                <textarea
                  className={styles.textarea}
                  rows={2}
                  placeholder="Anything blocking you, or context for whoever reviews this next…"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </>
          )}

          {isBlocked && (
            <p style={{ fontSize: 12.5, color: '#92400e', background: '#fffbeb', borderRadius: 8, padding: '8px 12px', marginTop: 12 }}>
              This task is marked blocked. Contact your admin to have it reopened.
            </p>
          )}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          {/* Submit only makes sense once work has actually started — for a
              never-started task the Start Task button above is the only
              action. For rejected, Submit is available alongside Resume so
              a task that's still mid-session can be resubmitted directly. */}
          {isEditable && !isNeverStarted && (
            <button type="button" className={styles.saveBtn} onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit for review'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}