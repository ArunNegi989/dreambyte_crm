"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Task, DashboardStats, TaskDetails } from '../../../types/seodashboard/task';
import { groupTasksByDueDate } from '../../../data/seodashboard/taskStats';
import { getMyTasks, getDashboardStats, startTask, submitTask } from '../../api/seoApi';
import { logout } from '../../api/authApi';
import StatCard from '../../../components/dashboard/seodashboard/StatCard';
import CategoryBreakdown from '../../../components/dashboard/seodashboard/CategoryBreakdown';
import TaskTable from '../../../components/dashboard/seodashboard/TaskTable';
import TaskModal from '../../../components/dashboard/seodashboard/TaskModal';
import styles from '../../../assets/styles/seodashboard/Dashboard.module.css';

const ICONS = {
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
  extra: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 5v14M5 12h14" /></svg>
  ),
};

const PAGE_SIZE = 10;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function SeoDashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // ── Date filter: lets the employee jump back to any previous date's
  // tasks right from the dashboard, without leaving the page. ──────────
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const isToday = selectedDate === todayStr();

  // ── Logged-in employee's display name, read from the same localStorage
  // blob the rest of the app uses for auth state. ──────────────────────
  const [employeeName, setEmployeeName] = useState<string>('');
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const parsed = JSON.parse(raw);
        setEmployeeName(parsed?.name || parsed?.fullName || parsed?.employeeName || '');
      }
    } catch {
      setEmployeeName('');
    }
  }, []);

  // Single page number across the whole filtered task list.
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [fetchedTasks, fetchedStats] = await Promise.all([getMyTasks({}), getDashboardStats()]);
      setTasks(fetchedTasks);
      setStats(fetchedStats);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Live timer refresh ──────────────────────────────────────────────
  // Same fix as every other dashboard: any task whose clock is currently
  // running (currentSessionStartedAt set) needs a re-render every 30s so
  // "Time taken" keeps ticking up in the UI, even though nothing changed
  // server-side yet.
  useEffect(() => {
    const hasRunningTimer = tasks.some((t) => !!t.currentSessionStartedAt);
    if (!hasRunningTimer) return;
    const interval = setInterval(() => {
      setTasks((prev) => [...prev]);
    }, 30000);
    return () => clearInterval(interval);
  }, [tasks]);

  // ── Start Task — hits the dedicated timer endpoint (stamps
  // currentSessionStartedAt server-side), not a generic status PUT. Used
  // for both the table's inline "Start Task" button and the modal's
  // Start/Resume buttons. ──────────────────────────────────────────────
  const handleStartTask = async (task: Task) => {
    await startTask(task.id);
    fetchData();
  };

  // Modal's onStart only ever has the task id in scope, not the full Task
  // object — same underlying action as handleStartTask above.
  const handleStartTaskById = async (taskId: string) => {
    await startTask(taskId);
    fetchData();
  };

  // ── Submit for Review — stops the timer, saves the category detail
  // fields, and the backend moves status -> completed. Replaces the old
  // free-form status dropdown entirely.
  const handleSubmitTask = async (taskId: string, remarks: string, details: TaskDetails) => {
    await submitTask(taskId, { remarks, details });
    fetchData();
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      router.replace('/auth/login');
    }
  };

  // When a specific past date is picked, show just that date's tasks;
  // otherwise fall back to the normal "grouped by due date" view.
  const dateFilteredTasks = useMemo(
    () => (isToday ? tasks : tasks.filter((t) => t.dueDate === selectedDate)),
    [tasks, selectedDate, isToday]
  );

  const totalPages = Math.max(1, Math.ceil(dateFilteredTasks.length / PAGE_SIZE));

  // Reset to page 1 whenever the filtered set changes.
  useEffect(() => {
    setPage(1);
  }, [selectedDate, tasks.length]);

  const safePage = Math.min(page, totalPages);
  const pagedTasks = useMemo(
    () => dateFilteredTasks.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [dateFilteredTasks, safePage]
  );

  // Group only the current page's slice, so headers reflect what's actually shown.
  const groups = groupTasksByDueDate(pagedTasks);
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>{today}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {employeeName && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px 6px 6px',
                borderRadius: 999,
                background: '#f1f5f9',
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: '#3b82f6',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {employeeName.charAt(0).toUpperCase()}
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 500, color: '#1e293b' }}>{employeeName}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <input
              type="date"
              value={selectedDate}
              max={todayStr()}
              onChange={(e) => setSelectedDate(e.target.value || todayStr())}
              title="Check tasks from a previous date"
              style={{ border: 'none', background: 'transparent', fontSize: 12, cursor: 'pointer', colorScheme: 'light' }}
            />
            {!isToday && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr())}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 11,
                  textDecoration: 'underline',
                  color: 'inherit',
                  padding: 0,
                }}
              >
                Today
              </button>
            )}
          </div>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout} disabled={loggingOut}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {loggingOut ? 'Signing out…' : 'Logout'}
          </button>
        </div>
      </header>

      {loading ? (
        <p className={styles.loadingText}>Loading dashboard…</p>
      ) : error ? (
        <div className={styles.errorBox}>
          <p>{error}</p>
          <button type="button" onClick={fetchData} className={styles.retryBtn}>Retry</button>
        </div>
      ) : (
        <>
          {stats && (
            <div className={styles.statsRow}>
              <StatCard label="Total tasks" value={stats.total} icon={ICONS.total} tone="primary" />
              <StatCard label="In progress" value={stats.inProgress} icon={ICONS.progress} tone="default" />
              <StatCard label="Completed" value={stats.completed} icon={ICONS.completed} tone="success" />
              <StatCard label="Overdue" value={stats.overdue} icon={ICONS.overdue} tone="danger" />
              <StatCard label="Additional work logged" value={stats.additionalTasksLogged} icon={ICONS.extra} tone="default" />
            </div>
          )}

          <div className={styles.performanceGrid}>
            <section className={styles.performanceCard}>
              <div className={styles.performanceHeader}>
                <h2 className={styles.sectionTitle}>Overall performance</h2>
                <span className={styles.completionTag}>{stats?.completionRate ?? 0}% completion rate</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${stats?.completionRate ?? 0}%` }} />
              </div>
              <div className={styles.statusLegend}>
                <span><i className={`${styles.legendDot} ${styles.dotPending}`} />Pending {stats?.pending ?? 0}</span>
                <span><i className={`${styles.legendDot} ${styles.dotProgress}`} />In progress {stats?.inProgress ?? 0}</span>
                <span><i className={`${styles.legendDot} ${styles.dotDone}`} />Completed {stats?.completed ?? 0}</span>
                <span><i className={`${styles.legendDot} ${styles.dotBlocked}`} />Blocked {stats?.blocked ?? 0}</span>
              </div>
            </section>

            <section className={styles.performanceCard}>
              <h2 className={styles.sectionTitle}>Tasks by category</h2>
              {stats && stats.categoryBreakdown.length > 0 ? (
                <CategoryBreakdown data={stats.categoryBreakdown} />
              ) : (
                <p className={styles.emptyText}>No tasks yet.</p>
              )}
            </section>
          </div>

          <section className={styles.tasksSection}>
            <h2 className={styles.sectionTitle}>
              {isToday ? 'Tasks by date' : `Tasks — ${selectedDate}`} ({dateFilteredTasks.length})
            </h2>
            {groups.length === 0 ? (
              <p className={styles.emptyText}>
                {isToday ? 'Nothing assigned right now.' : 'No tasks due on this date.'}
              </p>
            ) : (
              <>
                {groups.map((group) => (
                  <div key={group.dateKey} className={styles.dateGroup}>
                    <div className={styles.dateGroupHeader}>
                      <h3 className={styles.dateGroupLabel}>{group.label}</h3>
                      <span className={styles.dateGroupCount}>{group.tasks.length}</span>
                    </div>
                    <TaskTable tasks={group.tasks} onOpen={setSelectedTask} onStartTask={handleStartTask} />
                  </div>
                ))}

                {totalPages > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12,
                      padding: '16px 0 4px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setPage(safePage - 1)}
                      disabled={safePage <= 1}
                      style={{
                        padding: '4px 10px',
                        fontSize: 12,
                        borderRadius: 6,
                        border: '1px solid #e2e8f0',
                        background: '#fff',
                        cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                        opacity: safePage <= 1 ? 0.5 : 1,
                      }}
                    >
                      Prev
                    </button>
                    <span style={{ fontSize: 12.5, color: '#64748b' }}>
                      Page {safePage} of {totalPages} · {dateFilteredTasks.length} tasks
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage(safePage + 1)}
                      disabled={safePage >= totalPages}
                      style={{
                        padding: '4px 10px',
                        fontSize: 12,
                        borderRadius: 6,
                        border: '1px solid #e2e8f0',
                        background: '#fff',
                        cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                        opacity: safePage >= totalPages ? 0.5 : 1,
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStart={handleStartTaskById}
          onSubmit={handleSubmitTask}
          onRespond={fetchData}
        />
      )}
    </div>
  );
}