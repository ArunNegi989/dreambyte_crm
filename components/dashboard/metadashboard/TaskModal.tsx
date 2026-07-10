"use client";

import React, { useEffect, useState } from 'react';
import { CATEGORY_META } from '../../../data/metadashboard/dummyData';
import { Task } from '../../../types/metadashboard/metaTask';
import { submitTaskWork, respondToTaskChanges } from '../../../app/api/metaApi';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onSaved: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  in_progress: 'In progress',
  rejected: 'Rejected',
  completed: 'Completed',
  changes_requested: 'Changes requested',
};

// ── Time-taken helpers (inlined — no shared util file) ──
function formatDuration(ms: number): string {
  if (ms <= 0) return '0m';
  const totalMinutes = Math.floor(ms / 60000);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function getTimeTakenLabel(startedAt?: string, deliveredAt?: string, now: number = Date.now()): string | null {
  if (!startedAt) return null;
  const start = new Date(startedAt).getTime();
  if (Number.isNaN(start)) return null;
  const end = deliveredAt ? new Date(deliveredAt).getTime() : now;
  return formatDuration(Math.max(0, end - start));
}

export default function TaskModal({ task, onClose, onSaved }: TaskModalProps) {
  const [note, setNote] = useState('');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Ticks every 30s so a running timer stays live while the modal is open.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const cat = CATEGORY_META[task.category as keyof typeof CATEGORY_META];
  const openChanges = task.changes.filter((c) => !c.resolved);
  const resolvedChanges = task.changes.filter((c) => c.resolved);
  const hasOpenChanges = openChanges.length > 0;

  const isDone = task.status === 'completed' || task.status === 'approved';

  const timeTaken = getTimeTakenLabel(task.startedAt, task.deliveredAt, now);
  const isRunning = task.status === 'in_progress' && !task.deliveredAt;

  const handleSubmitWork = async () => {
    try {
      setSaving(true);
      setError('');
      await submitTaskWork(task.id, note, new Date().toISOString());
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit task');
    } finally {
      setSaving(false);
    }
  };

  const handleRespond = async () => {
    const payload = openChanges.map((c) => ({ id: c._id, response: (responses[c._id] ?? '').trim() }));
    if (payload.some((r) => r.response.length === 0)) {
      setError('Please reply to every open note before resubmitting.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await respondToTaskChanges(task.id, payload, note);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send responses');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="md-overlay" onClick={onClose}>
      <div className="md-modal" onClick={(e) => e.stopPropagation()}>
        <div className="md-modal-header">
          <div>
            <span
              className="md-chip"
              style={cat ? { color: cat.color, background: `${cat.color}1a` } : undefined}
            >
              {cat?.label ?? task.category ?? 'Task'}
            </span>
            <h2 className="md-modal-title">{task.title}</h2>
          </div>
          <button type="button" className="md-modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="md-modal-body">
          <p className="md-modal-desc">{task.description}</p>

          <div className="md-detail-grid">
            <div className="md-detail-item">
              <span className="md-detail-key">Status</span>
              <span className="md-detail-val">{STATUS_LABELS[task.status] ?? task.status}</span>
            </div>
            <div className="md-detail-item">
              <span className="md-detail-key">Due date</span>
              <span className="md-detail-val">{task.dueDate || '—'}</span>
            </div>
            <div className="md-detail-item">
              <span className="md-detail-key">Delivery</span>
              <span className="md-detail-val">{task.deliveryStatus === 'delivered' ? 'Delivered' : 'Not delivered'}</span>
            </div>
            {timeTaken && (
              <div className="md-detail-item">
                <span className="md-detail-key">Time taken</span>
                <span className="md-detail-val">
                  {timeTaken}{isRunning ? ' (running)' : ''}
                </span>
              </div>
            )}
            {Object.entries(task.details).map(([key, value]) => (
              <div className="md-detail-item" key={key}>
                <span className="md-detail-key">{key}</span>
                <span className="md-detail-val">{value}</span>
              </div>
            ))}
          </div>

          {task.status === 'approved' && (
            <div className="md-field">
              <p style={{ fontSize: 12.5, color: 'var(--md-text-muted)' }}>
                ✓ This task has been approved. No further action is needed.
              </p>
            </div>
          )}

          {task.status === 'pending' && (
            <div className="md-field">
              <p style={{ fontSize: 12.5, color: 'var(--md-text-muted)' }}>
                Use the <strong>Start</strong> button on the task list to begin work — that's what
                kicks off the time-taken clock.
              </p>
            </div>
          )}

          {hasOpenChanges && task.status !== 'approved' && (
            <div className="md-field">
              <label className="md-field-label">Admin notes awaiting your reply</label>
              {openChanges.map((c) => (
                <div key={c._id} style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 12.5, color: 'var(--md-text-muted)', marginBottom: 4 }}>
                    <strong>{c.changedBy}</strong> · {c.changedAt}: {c.note}
                  </p>
                  <textarea
                    className="md-textarea"
                    placeholder="Your reply to this note…"
                    value={responses[c._id] ?? ''}
                    onChange={(e) => setResponses((prev) => ({ ...prev, [c._id]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          )}

          {resolvedChanges.length > 0 && (
            <div className="md-field">
              <label className="md-field-label">History</label>
              {resolvedChanges.map((c) => (
                <p key={c._id} style={{ fontSize: 12, color: 'var(--md-text-faint)', marginBottom: 6 }}>
                  {c.changedAt} · {c.changedBy}: {c.note}
                  {c.employeeResponse && <> — <em>you replied: {c.employeeResponse}</em></>}
                </p>
              ))}
            </div>
          )}

          {!isDone && task.status !== 'pending' && (
            <div className="md-field">
              <label className="md-field-label">
                {hasOpenChanges ? 'Note for admin (optional)' : 'Delivery note (optional)'}
              </label>
              <textarea
                className="md-textarea"
                placeholder="Add context, links, or anything the reviewer should know…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          )}

          {error && <p style={{ color: 'var(--md-danger)', fontSize: 12.5, fontWeight: 500 }}>{error}</p>}
        </div>

        <div className="md-modal-footer">
          <button type="button" className="md-btn-secondary" onClick={onClose}>Close</button>

          {!isDone && hasOpenChanges ? (
            <button type="button" className="md-btn-primary" onClick={handleRespond} disabled={saving}>
              {saving ? 'Sending…' : 'Send replies & resubmit'}
            </button>
          ) : !isDone && task.status !== 'pending' ? (
            <button type="button" className="md-btn-primary" onClick={handleSubmitWork} disabled={saving}>
              {saving ? 'Submitting…' : 'Mark as done'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}