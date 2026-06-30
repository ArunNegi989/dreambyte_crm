"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Task, DeliveryState } from '../../../types/employee/task';
import { groupTasksByDueDate } from '../../../data/employee/taskStats';
import { getMyTasks, getDashboardStats, submitTask, respondToChanges } from '../../api/employeeApi';
import { logout } from '../../api/authApi';
import Sidebar from '../../../components/dashboard/employeedashboard/Sidebar';
import DateFilter from './DateFilter';
import StatsBar from '../../../components/dashboard/employeedashboard/StatsBar';
import TaskTable from './TaskTable';
import TaskModal from '../../../components/dashboard/employeedashboard/Taskmodal';
import styles from '../../../assets/styles/employeedashboard/EmployeeDashboard.module.css';

type FilterValue = 'all' | Task['status'];

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'changes_requested', label: 'Changes requested' },
  { value: 'completed', label: 'Completed' },
  { value: 'approved', label: 'Approved' },
];

export default function EmployeeDashboardPage() {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [userName, setUserName] = useState('');

  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    setUserName(localStorage.getItem('userName') || '');
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedTasks, fetchedStats] = await Promise.all([
        getMyTasks({
          status: activeFilter !== 'all' ? activeFilter : undefined,
          date: selectedDate || undefined,
        }),
        getDashboardStats(),
      ]);
      setTasks(fetchedTasks);
      setStats(fetchedStats);
    } catch (err: any) {
      if (err.message?.includes('401') || err.message?.toLowerCase().includes('token')) {
        router.push('/auth/login');
        return;
      }
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, selectedDate, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Keep the open modal's task in sync after a refetch, so a freshly
  // rejected task's message shows up immediately if the modal is open.
  useEffect(() => {
    if (!selectedTask) return;
    const fresh = tasks.find((t) => t.id === selectedTask.id);
    if (fresh) setSelectedTask(fresh);
  }, [tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  const groupedTasks = useMemo(() => groupTasksByDueDate(tasks, now), [tasks, now]);
  const hasActiveFilters = activeFilter !== 'all' || selectedDate !== '';

  const handleClearFilters = () => { setActiveFilter('all'); setSelectedDate(''); };
  const handleOpenTask = (task: Task) => setSelectedTask(task);
  const handleCloseModal = () => setSelectedTask(null);

  const handleLogout = async () => {
    try {
      await logout('employee');
    } finally {
      localStorage.clear();
      router.push('/auth/login');
    }
  };

  const handleSubmitTask = async (taskId: string, deliveryState: DeliveryState, remarks: string, startedAt: string) => {
    try {
      const updated = await submitTask(taskId, { deliveryState, remarks, startedAt });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      setSelectedTask(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit task');
    }
  };

  const handleSubmitChangeResponses = async (taskId: string, deliveryState: DeliveryState, remarks: string, responses: { id: string; response: string }[]) => {
    try {
      const updated = await respondToChanges(taskId, { deliveryState, remarks, responses });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      setSelectedTask(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit changes');
    }
  };

  const initials = userName ? userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'N';

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.page}>
        <div className={styles.topBar}>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="16" height="16">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Logout
          </button>
          <a href="/dashboard/employeedashboard/profile" className={styles.profileBtn} title="View profile">
            <span className={styles.profileInitials}>{initials}</span>
          </a>
        </div>

        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>My tasks</h1>
          <p className={styles.pageSubtitle}>Track, submit, and resolve feedback on your assigned tasks</p>
        </header>

        {stats && <StatsBar stats={stats} />}

        <div className={styles.filterRow}>
          {FILTERS.map((f) => (
            <button key={f.value}
              className={`${styles.filterBtn} ${activeFilter === f.value ? styles.filterBtnActive : ''}`}
              onClick={() => setActiveFilter(f.value)}>
              {f.label}
            </button>
          ))}
          <div className={styles.dateFilterSlot}>
            <DateFilter value={selectedDate} onChange={setSelectedDate} />
          </div>
        </div>

        {loading ? (
          <div className={styles.emptyState}>
            <p className={styles.emptySubtitle}>Loading tasks…</p>
          </div>
        ) : error ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>Something went wrong</p>
            <p className={styles.emptySubtitle}>{error}</p>
            <button className={styles.emptyClearBtn} onClick={fetchData}>Retry</button>
          </div>
        ) : groupedTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 9h18M8 3v4M16 3v4M9 14l2 2 4-4" />
            </svg>
            <p className={styles.emptyTitle}>No tasks here</p>
            <p className={styles.emptySubtitle}>Nothing matches this filter right now</p>
            {hasActiveFilters && <button className={styles.emptyClearBtn} onClick={handleClearFilters}>Clear filters</button>}
          </div>
        ) : (
          groupedTasks.map((group) => (
            <section key={group.dateKey} className={styles.dateGroup}>
              <div className={styles.dateGroupHeader}>
                <h2 className={styles.dateGroupLabel}>{group.label}</h2>
                <span className={styles.dateGroupCount}>{group.tasks.length}</span>
              </div>
              <TaskTable tasks={group.tasks} onOpen={handleOpenTask} />
            </section>
          ))
        )}

        {selectedTask && (
          <TaskModal task={selectedTask} onClose={handleCloseModal}
            onSubmitTask={handleSubmitTask} onSubmitChangeResponses={handleSubmitChangeResponses} />
        )}
      </div>
    </div>
  );
}