"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { Task, DashboardStats, TaskStatus } from '../../../types/seodashboard/task';
import { groupTasksByDueDate } from '../../../data/employee/seodashboard/taskStats';
import { getMyTasks, getDashboardStats, updateTaskWork } from '../../api/seoApi';
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

export default function SeoDashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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

  const handleSaveTask = async (taskId: string, payload: { status: TaskStatus; remarks: string; details: any }) => {
    await updateTaskWork(taskId, payload);
    fetchData();
  };

  const groups = groupTasksByDueDate(tasks);
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>{today}</p>
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
            <h2 className={styles.sectionTitle}>Tasks by date</h2>
            {groups.length === 0 ? (
              <p className={styles.emptyText}>Nothing assigned right now.</p>
            ) : (
              groups.map((group) => (
                <div key={group.dateKey} className={styles.dateGroup}>
                  <div className={styles.dateGroupHeader}>
                    <h3 className={styles.dateGroupLabel}>{group.label}</h3>
                    <span className={styles.dateGroupCount}>{group.tasks.length}</span>
                  </div>
                  <TaskTable tasks={group.tasks} onOpen={setSelectedTask} />
                </div>
              ))
            )}
          </section>
        </>
      )}

      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} onSave={handleSaveTask} />
      )}
    </div>
  );
}
