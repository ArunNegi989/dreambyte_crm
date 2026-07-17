"use client";

// app/dashboard/metadashboard/tasks/page.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CATEGORY_META,
  CATEGORY_OPTIONS,
} from '../../../../data/metadashboard/dummyData';
import { Task } from '../../../../types/metadashboard/metaTask';
import TaskModal from '../../../../components/dashboard/metadashboard/TaskModal';
import { fetchMyTasks, startTask } from '../../../api/metaApi';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'changes_requested', label: 'Changes requested' },
];

const STATUS_BADGE_CLASS: Record<string, string> = {
  pending: 'pending',
  approved: 'pending',
  in_progress: 'in-progress',
  completed: 'completed',
  rejected: 'blocked',
  changes_requested: 'blocked',
};

const STATUS_DISPLAY: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  in_progress: 'In progress',
  completed: 'Completed',
  rejected: 'Rejected',
  changes_requested: 'Changes requested',
};

type QuickRange = 'all' | 'today' | 'week' | 'month';

const toIso = (d: Date) => d.toISOString().slice(0, 10);

function weekRange(now: Date) {
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: toIso(start), end: toIso(end) };
}

function monthRange(now: Date) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: toIso(start), end: toIso(end) };
}

// ── Time-taken helpers (inlined — no shared util file) ──
// Session-based: only counts time while the timer was actually running.
function formatDuration(ms: number): string {
  if (ms <= 0) return '0m';
  const totalMinutes = Math.floor(ms / 60000);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function getTimeTakenLabel(timeSpentMs?: number, currentSessionStartedAt?: string | null, now: number = Date.now()): string | null {
  const base = timeSpentMs || 0;
  const live = currentSessionStartedAt ? Math.max(0, now - new Date(currentSessionStartedAt).getTime()) : 0;
  const total = base + live;
  if (total <= 0) return null;
  return formatDuration(total);
}

function canStartFromList(t: Task) {
  return t.status === 'pending';
}

// ── Resume for rejected/changes_requested tasks whose timer isn't
// currently running. Restarts the clock; status stays untouched so the
// rejection banner + change log keep showing until the employee actually
// replies and resubmits via the modal.
function canResumeFromList(t: Task) {
  return (t.status === 'rejected' || t.status === 'changes_requested') && !t.currentSessionStartedAt;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

  const [quickRange, setQuickRange] = useState<QuickRange>('all');
  const [specificDate, setSpecificDate] = useState<string>('');

  // Ticks every 30s so any running "time taken" cell stays live.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const [employeeId, setEmployeeId] = useState<string>('');
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const parsed = JSON.parse(raw);
        setEmployeeId(parsed?._id || parsed?.id || '');
      }
    } catch {
      setEmployeeId('');
    }
  }, []);

  const loadTasks = useCallback(async () => {
    if (!employeeId) return;
    try {
      setLoading(true);
      setError(null);
      const fetched = await fetchMyTasks(employeeId);
      setTasks(fetched);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // ── Used for BOTH "Start" (pending) and "Resume Task" (rejected/
  // changes_requested) — same generic /start endpoint, backend decides
  // what status transition (if any) is appropriate.
  const handleStart = useCallback(
    async (e: React.MouseEvent, taskId: string) => {
      e.stopPropagation();
      if (startingId) return;
      setStartingId(taskId);
      try {
        await startTask(taskId);
        await loadTasks();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start task');
      } finally {
        setStartingId(null);
      }
    },
    [loadTasks, startingId]
  );

  const todayIso = toIso(new Date());

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

      if (specificDate) {
        if (t.dueDate !== specificDate) return false;
      } else if (quickRange === 'today') {
        if (t.dueDate !== todayIso) return false;
      } else if (quickRange === 'week') {
        const { start, end } = weekRange(new Date());
        if (!(t.dueDate >= start && t.dueDate <= end)) return false;
      } else if (quickRange === 'month') {
        const { start, end } = monthRange(new Date());
        if (!(t.dueDate >= start && t.dueDate <= end)) return false;
      }

      return true;
    });
  }, [tasks, statusFilter, categoryFilter, quickRange, specificDate, todayIso]);

  const resetDateFilter = () => {
    setQuickRange('all');
    setSpecificDate('');
  };

  return (
    <div>
      <header className="md-header">
        <div>
          <h1 className="md-title">Tasks</h1>
          <p className="md-subtitle">
            {loading ? 'Loading…' : `${filtered.length} of ${tasks.length} tasks shown`}
          </p>
        </div>
      </header>

      {loading && <p className="md-empty-text">Loading your tasks…</p>}

      {!loading && error && (
        <div className="md-empty">
          <p className="md-empty-title">Couldn't load your tasks</p>
          <p className="md-empty-text">{error}</p>
          <button type="button" className="md-btn-secondary" onClick={loadTasks}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="md-filter-row">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={`md-filter-btn ${statusFilter === f.value ? 'active' : ''}`}
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="md-filter-row" style={{ alignItems: 'center' }}>
            {(['all', 'today', 'week', 'month'] as QuickRange[]).map((r) => (
              <button
                key={r}
                type="button"
                className={`md-filter-btn ${quickRange === r && !specificDate ? 'active' : ''}`}
                onClick={() => {
                  setQuickRange(r);
                  setSpecificDate('');
                }}
              >
                {r === 'all' ? 'All dates' : r === 'today' ? 'Today' : r === 'week' ? 'This week' : 'This month'}
              </button>
            ))}
            <input
              type="date"
              className="md-input"
              value={specificDate}
              onChange={(e) => {
                setSpecificDate(e.target.value);
                setQuickRange('all');
              }}
              title="Pick a specific due date"
            />
            {(specificDate || quickRange !== 'all') && (
              <button type="button" className="md-btn-secondary" onClick={resetDateFilter}>
                Clear date
              </button>
            )}
          </div>

          <div className="md-field" style={{ maxWidth: 260, marginBottom: 18 }}>
            <select className="md-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All categories</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="md-empty">
              <p className="md-empty-title">No tasks match these filters</p>
              <p className="md-empty-text">Try a different status, category, or date.</p>
            </div>
          ) : (
            <div className="md-table-wrap">
              <table className="md-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Time taken</th>
                    <th>Due</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => {
                    const meta = CATEGORY_META[t.category as keyof typeof CATEGORY_META];
                    const timeTaken = getTimeTakenLabel(t.timeSpentMs, t.currentSessionStartedAt, now);
                    const isRunning = !!t.currentSessionStartedAt;
                    return (
                      <tr key={t.id} className="clickable" onClick={() => setSelectedTask(t)}>
                        <td className="md-task-title">{t.title}</td>
                        <td>
                          <span
                            className="md-chip"
                            style={meta ? { color: meta.color, background: `${meta.color}1a` } : undefined}
                          >
                            {meta?.label ?? t.category ?? 'Uncategorized'}
                          </span>
                        </td>
                        <td><span className={`md-badge ${t.priority}`}>{t.priority}</span></td>
                        <td><span className={`md-status ${STATUS_BADGE_CLASS[t.status] ?? 'pending'}`}>{STATUS_DISPLAY[t.status] ?? t.status}</span></td>
                        <td className="md-due">
                          {timeTaken ? `${timeTaken}${isRunning ? ' ⏱' : ''}` : '—'}
                        </td>
                        <td className="md-due">{t.dueDate || '—'}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {canStartFromList(t) && (
                            <button
                              type="button"
                              className="md-btn-secondary"
                              style={{ padding: '4px 10px', fontSize: 12 }}
                              disabled={startingId === t.id}
                              onClick={(e) => handleStart(e, t.id)}
                            >
                              {startingId === t.id ? 'Starting…' : 'Start'}
                            </button>
                          )}
                          {canResumeFromList(t) && (
                            <button
                              type="button"
                              className="md-btn-secondary"
                              style={{ padding: '4px 10px', fontSize: 12, background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' }}
                              disabled={startingId === t.id}
                              onClick={(e) => handleStart(e, t.id)}
                            >
                              {startingId === t.id ? 'Resuming…' : 'Resume Task'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSaved={loadTasks}
        />
      )}
    </div>
  );
}