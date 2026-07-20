"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Task, TaskStatus, TaskDetails, CATEGORY_OPTIONS } from '../../../../types/seodashboard/task';
import { getMyTasks, startTask, submitTask } from '../../../api/seoApi';
import TaskTable from '../../../../components/dashboard/seodashboard/TaskTable';
import TaskModal from '../../../../components/dashboard/seodashboard/TaskModal';
import styles from '../../../../assets/styles/seodashboard/Tasks.module.css';

const STATUS_FILTERS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'blocked', label: 'Blocked' },
];

export default function SeoTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TaskStatus | 'all'>('all');
  const [category, setCategory] = useState('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const fetched = await getMyTasks({});
      setTasks(fetched);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!selectedTask) return;
    const fresh = tasks.find((t) => t.id === selectedTask.id);
    if (fresh) setSelectedTask(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  // ── Live timer refresh — same pattern as the dashboard page. ─────────
  useEffect(() => {
    const hasRunningTimer = tasks.some((t) => !!t.currentSessionStartedAt);
    if (!hasRunningTimer) return;
    const interval = setInterval(() => {
      setTasks((prev) => [...prev]);
    }, 30000);
    return () => clearInterval(interval);
  }, [tasks]);

  // ── Start/Resume — dedicated timer endpoint, not a generic status PUT.
  const handleStartTask = async (taskId: string) => {
    await startTask(taskId);
    fetchData();
  };

  // ── Submit for Review — stops the timer, saves category detail fields,
  // backend moves status -> completed.
  const handleSubmitTask = async (taskId: string, remarks: string, details: TaskDetails) => {
    await submitTask(taskId, { remarks, details });
    fetchData();
  };

  const filteredTasks = useMemo(() => {
    let result = tasks.slice();
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q) || t.brandName.toLowerCase().includes(q));
    }
    if (status !== 'all') result = result.filter((t) => t.status === status);
    if (category !== 'all') result = result.filter((t) => t.category === category);
    result.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    return result;
  }, [tasks, search, status, category]);

  const hasActiveFilters = search.trim() !== '' || status !== 'all' || category !== 'all';
  const clearFilters = () => { setSearch(''); setStatus('all'); setCategory('all'); };

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Tasks</h1>
        <p className={styles.subtitle}>Everything assigned to you, across every SEO workstream</p>
      </header>

      <div className={styles.filterRow}>
        <div className={styles.searchField}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={styles.searchIcon}>
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by task or brand…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.pillGroup}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`${styles.pill} ${status === f.value ? styles.pillActive : ''}`}
              onClick={() => setStatus(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select className={styles.categorySelect} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button type="button" className={styles.clearBtn} onClick={clearFilters}>Clear filters</button>
        )}
      </div>

      {loading ? (
        <p className={styles.emptyText}>Loading tasks…</p>
      ) : error ? (
        <div className={styles.errorBox}>
          <p>{error}</p>
          <button type="button" onClick={fetchData} className={styles.retryBtn}>Retry</button>
        </div>
      ) : (
        <>
          <p className={styles.resultCount}>{filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}</p>
          {filteredTasks.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No tasks found</p>
              <p className={styles.emptyText}>Try adjusting or clearing your filters.</p>
            </div>
          ) : (
            <TaskTable
              tasks={filteredTasks}
              onOpen={setSelectedTask}
              onStartTask={(task) => handleStartTask(task.id)}
            />
          )}
        </>
      )}

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStart={handleStartTask}
          onSubmit={handleSubmitTask}
          onRespond={fetchData}
        />
      )}
    </div>
  );
}