"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORY_META } from '../../../data/metadashboard/dummyData';
import { Task } from '../../../types/metadashboard/metaTask';
import TaskModal from '../../../components/dashboard/metadashboard/TaskModal';
import { fetchMyTasks, fetchDashboardStats, setTaskInProgress, MetaStats } from '../../api/metaApi';
import { logout } from '../../api/authApi';

const STAT_ICONS = {
  total: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9h10M7 13h10M7 17h6" /></svg>
  ),
  progress: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
  ),
  completed: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 5-5" /></svg>
  ),
  overdue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 9v4M12 17h.01" /><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /></svg>
  ),
};

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';

const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: 'all', label: 'All dates' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'custom', label: 'Custom range' },
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

function isOverdue(t: Task, today: string) {
  return t.status !== 'completed' && !!t.dueDate && t.dueDate < today;
}

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

function filterByDate(tasks: Task[], filter: DateFilter, today: string, customRange: { from: string; to: string }) {
  if (filter === 'all') return tasks;
  if (filter === 'today') return tasks.filter((t) => t.dueDate === today);
  if (filter === 'week') {
    const { start, end } = weekRange(new Date());
    return tasks.filter((t) => t.dueDate >= start && t.dueDate <= end);
  }
  if (filter === 'month') {
    const { start, end } = monthRange(new Date());
    return tasks.filter((t) => t.dueDate >= start && t.dueDate <= end);
  }
  if (!customRange.from || !customRange.to) return tasks;
  return tasks.filter((t) => t.dueDate >= customRange.from && t.dueDate <= customRange.to);
}

function groupByCategory(tasks: Task[]) {
  const byCat = new Map<string, Task[]>();
  tasks.forEach((t) => {
    const key = t.category || 'uncategorized';
    if (!byCat.has(key)) byCat.set(key, []);
    byCat.get(key)!.push(t);
  });
  return Array.from(byCat.entries()).map(([category, tasks]) => ({ category, tasks }));
}

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

// A task can be started directly from the list when it's pending and has
// no open admin notes waiting on a reply (those still go through the modal).
function canStartFromList(t: Task) {
  const hasOpenChanges = t.changes?.some((c) => !c.resolved) ?? false;
  return t.status === 'pending' && !hasOpenChanges;
}

export default function MetaDashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<MetaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customRange, setCustomRange] = useState({ from: '', to: '' });
  const [loggingOut, setLoggingOut] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);

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

  const loadAll = useCallback(async () => {
    if (!employeeId) return;
    try {
      setLoading(true);
      setError(null);
      const [fetchedTasks, fetchedStats] = await Promise.all([
        fetchMyTasks(employeeId),
        fetchDashboardStats(employeeId),
      ]);
      setTasks(fetchedTasks);
      setStats(fetchedStats);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleStart = useCallback(
    async (e: React.MouseEvent, taskId: string) => {
      e.stopPropagation(); // don't also open the row's modal
      if (startingId) return;
      setStartingId(taskId);
      try {
        await setTaskInProgress(taskId);
        await loadAll();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start task');
      } finally {
        setStartingId(null);
      }
    },
    [loadAll, startingId]
  );

  const todayIso = new Date().toISOString().slice(0, 10);
  const filteredTasks = useMemo(
    () => filterByDate(tasks, dateFilter, todayIso, customRange),
    [tasks, dateFilter, todayIso, customRange]
  );
  const groups = useMemo(() => groupByCategory(filteredTasks), [filteredTasks]);
  const maxCat = Math.max(1, ...(stats?.categoryBreakdown.map((c) => c.count) ?? [1]));
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      router.replace('/auth/login');
    }
  };

  return (
    <div>
      <header className="md-header">
        <div>
          <h1 className="md-title">Dashboard</h1>
          <p className="md-subtitle">{today}</p>
        </div>
        <button type="button" className="md-logout-btn" onClick={handleLogout} disabled={loggingOut}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {loggingOut ? 'Signing out…' : 'Logout'}
        </button>
      </header>

      {loading && <p className="md-empty-text">Loading your tasks…</p>}

      {!loading && error && (
        <div className="md-empty">
          <p className="md-empty-title">Couldn't load your dashboard</p>
          <p className="md-empty-text">{error}</p>
          <button type="button" className="md-btn-secondary" onClick={loadAll}>Retry</button>
        </div>
      )}

      {!loading && !error && stats && (
        <>
          <div className="md-stats-row">
            <div className="md-stat-card">
              <span className="md-stat-icon">{STAT_ICONS.total}</span>
              <div><p className="md-stat-value">{stats.total}</p><p className="md-stat-label">Total tasks</p></div>
            </div>
            <div className="md-stat-card">
              <span className="md-stat-icon">{STAT_ICONS.progress}</span>
              <div><p className="md-stat-value">{stats.inProgress}</p><p className="md-stat-label">In progress</p></div>
            </div>
            <div className="md-stat-card success">
              <span className="md-stat-icon">{STAT_ICONS.completed}</span>
              <div><p className="md-stat-value">{stats.completed}</p><p className="md-stat-label">Completed</p></div>
            </div>
            <div className="md-stat-card danger">
              <span className="md-stat-icon">{STAT_ICONS.overdue}</span>
              <div><p className="md-stat-value">{stats.overdue}</p><p className="md-stat-label">Overdue</p></div>
            </div>
          </div>

          <div className="md-grid-2">
            <section className="md-card">
              <div className="md-card-header">
                <h2 className="md-section-title">Overall performance</h2>
                <span className="md-tag">{stats.completionRate}% completion rate</span>
              </div>
              <div className="md-progress-track">
                <div className="md-progress-fill" style={{ width: `${stats.completionRate}%` }} />
              </div>
              <div className="md-legend">
                <span><i className="md-dot pending" />Pending {stats.pending + stats.approved}</span>
                <span><i className="md-dot progress" />In progress {stats.inProgress}</span>
                <span><i className="md-dot done" />Completed {stats.completed}</span>
                <span><i className="md-dot blocked" />Blocked {stats.rejected + stats.changesRequested}</span>
              </div>
            </section>

            <section className="md-card">
              <div className="md-card-header">
                <h2 className="md-section-title">Tasks by category</h2>
              </div>
              {stats.categoryBreakdown.map((c) => {
                const meta = CATEGORY_META[c.category as keyof typeof CATEGORY_META];
                return (
                  <div className="md-cat-row" key={c.category}>
                    <span className="md-cat-label">{meta?.label ?? c.category}</span>
                    <div className="md-cat-track">
                      <div
                        className="md-cat-fill"
                        style={{ width: `${(c.count / maxCat) * 100}%`, background: meta?.color ?? '#94a3b8' }}
                      />
                    </div>
                    <span className="md-cat-count">{c.count}</span>
                  </div>
                );
              })}
            </section>
          </div>

          <section>
            <h2 className="md-section-title" style={{ marginBottom: 14 }}>Your tasks</h2>

            <div className="md-filter-row">
              {DATE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  className={`md-filter-btn ${dateFilter === f.value ? 'active' : ''}`}
                  onClick={() => setDateFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {dateFilter === 'custom' && (
              <div className="md-filter-row" style={{ alignItems: 'center', marginTop: -6 }}>
                <input
                  type="date"
                  className="md-input"
                  value={customRange.from}
                  onChange={(e) => setCustomRange((prev) => ({ ...prev, from: e.target.value }))}
                />
                <span style={{ color: 'var(--md-text-faint)', fontSize: 12.5 }}>to</span>
                <input
                  type="date"
                  className="md-input"
                  value={customRange.to}
                  onChange={(e) => setCustomRange((prev) => ({ ...prev, to: e.target.value }))}
                />
              </div>
            )}

            {groups.length === 0 ? (
              <div className="md-empty">
                <p className="md-empty-title">Nothing to show here</p>
                <p className="md-empty-text">No tasks match this date filter right now.</p>
              </div>
            ) : (
              groups.map((group) => {
                const meta = CATEGORY_META[group.category as keyof typeof CATEGORY_META];
                return (
                  <div className="md-date-group" key={group.category}>
                    <div className="md-date-group-header">
                      <span className="md-chip" style={meta ? { color: meta.color, background: `${meta.color}1a` } : undefined}>
                        {meta?.label ?? group.category}
                      </span>
                      <span className="md-date-group-count">{group.tasks.length}</span>
                    </div>
                    <div className="md-table-wrap">
                      <table className="md-table">
                        <thead>
                          <tr>
                            <th>Task</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Time taken</th>
                            <th>Due</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.tasks.map((t) => {
                            const timeTaken = getTimeTakenLabel(t.startedAt, t.deliveredAt, now);
                            const isRunning = t.status === 'in_progress' && !t.deliveredAt;
                            return (
                              <tr key={t.id} className="clickable" onClick={() => setSelectedTask(t)}>
                                <td className="md-task-title">{t.title}</td>
                                <td><span className={`md-badge ${t.priority}`}>{t.priority}</span></td>
                                <td><span className={`md-status ${STATUS_BADGE_CLASS[t.status] ?? 'pending'}`}>{STATUS_DISPLAY[t.status] ?? t.status}</span></td>
                                <td className="md-due">
                                  {timeTaken ? `${timeTaken}${isRunning ? ' ⏱' : ''}` : '—'}
                                </td>
                                <td className={`md-due ${isOverdue(t, todayIso) ? 'overdue' : ''}`}>{t.dueDate || '—'}</td>
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
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </>
      )}

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSaved={loadAll}
        />
      )}
    </div>
  );
}