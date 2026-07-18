"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Task, DeliveryState } from '../../../../types/employee/task';
import { getTimeTaken, getTimeTakenMs, getTotalChangeCount } from '../../../../data/employee/taskTimeHelpers';
import { getMyTasks, submitTask, respondToChanges } from '../../../api/employeeApi';
import Sidebar from '../../../../components/dashboard/employeedashboard/Sidebar';
import StatusBadge from '../../../../components/dashboard/employeedashboard/StatusBadge';
import TaskHistoryFilters, {
  StatusFilter,
  DeliveryFilter,
  ChangesFilter,
  SortOption,
} from './TasksHistoryFilters';
import TaskModal from '../../../../components/dashboard/employeedashboard/Taskmodal';
import styles from '../../../../assets/styles/employeedashboard/Taskhistory.module.css';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── THE FIX: this used to compute a raw task.startedAt -> task.completedAt
// wall-clock diff for sorting by "time taken". That formula has the same
// bug as the old getTimeTaken(): it ignores any time spent paused during a
// reject/changes_requested -> Resume Task cycle and can produce wildly
// wrong (multi-day/ballooned) values, which then sort completely out of
// order relative to what the "Time taken" column actually displays.
//
// Now delegates to getTimeTakenMs(), the same pause-aware
// timeSpentMs + currentSessionStartedAt formula the "Time taken" column
// itself uses (via getTimeTaken()) — so sort order always matches what's
// on screen.
function durationMs(task: Task): number {
  return getTimeTakenMs(task);
}

export default function TaskHistoryPage() {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [delivery, setDelivery] = useState<DeliveryFilter>('all');
  const [changes, setChanges] = useState<ChangesFilter>('all');
  const [sort, setSort] = useState<SortOption>('due_desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Fetch all of the employee's tasks (full history, no server-side status/date
  // filter) — filtering/sorting below is done client-side so every control stays
  // interactive without refetching.
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetched = await getMyTasks({});
      setTasks(fetched);
    } catch (err: any) {
      if (err.message?.includes('401') || err.message?.toLowerCase().includes('token')) {
        router.push('/auth/login');
        return;
      }
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Keep the open modal's task in sync after a refetch, same as the dashboard page.
  useEffect(() => {
    if (!selectedTask) return;
    const fresh = tasks.find((t) => t.id === selectedTask.id);
    if (fresh) setSelectedTask(fresh);
  }, [tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Live timer refresh — any task in the list whose clock is currently
  // running needs a re-render every 30s so the "time taken" label (and, if
  // sorted by time, the sort order) keeps updating even though nothing
  // changed server-side. Same pattern as every other dashboard. ──────────
  const [, forceTick] = useState(0);
  useEffect(() => {
    const hasRunning = tasks.some((t) => !!t.currentSessionStartedAt);
    if (!hasRunning) return;
    const id = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, [tasks]);

  const brands = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => set.add(t.brandName));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const hasActiveFilters =
    search.trim() !== '' ||
    brand !== 'all' ||
    status !== 'all' ||
    delivery !== 'all' ||
    changes !== 'all' ||
    dateFrom !== '' ||
    dateTo !== '';

  const handleClearAll = () => {
    setSearch('');
    setBrand('all');
    setStatus('all');
    setDelivery('all');
    setChanges('all');
    setDateFrom('');
    setDateTo('');
  };

  const handleOpenTask = (task: Task) => setSelectedTask(task);
  const handleCloseModal = () => setSelectedTask(null);

  // NOTE: startedAt is no longer sent to submitTask — backend stamps it
  // when startTask() is called. Kept param removed here to match
  // TaskModal's onSubmitTask signature exactly.
  const handleSubmitTask = async (
    taskId: string,
    deliveryState: DeliveryState,
    remarks: string
  ) => {
    try {
      const updated = await submitTask(taskId, { deliveryState, remarks });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      setSelectedTask(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit task');
    }
  };

  const handleSubmitChangeResponses = async (
    taskId: string,
    deliveryState: DeliveryState,
    remarks: string,
    responses: { id: string; response: string }[]
  ) => {
    try {
      const updated = await respondToChanges(taskId, { deliveryState, remarks, responses });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      setSelectedTask(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit changes');
    }
  };

  const filteredTasks = useMemo(() => {
    let result = tasks.slice();

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }

    if (brand !== 'all') {
      result = result.filter((t) => t.brandName === brand);
    }

    if (status !== 'all') {
      result = result.filter((t) => t.status === status);
    }

    if (delivery !== 'all') {
      result = result.filter((t) => t.deliveryState === delivery);
    }

    if (changes !== 'all') {
      result = result.filter((t) => {
        const count = getTotalChangeCount(t);
        return changes === 'has_changes' ? count > 0 : count === 0;
      });
    }

    if (dateFrom) {
      result = result.filter((t) => t.dueDate >= dateFrom);
    }

    if (dateTo) {
      result = result.filter((t) => t.dueDate <= dateTo);
    }

    result.sort((a, b) => {
      switch (sort) {
        case 'due_asc':
          return a.dueDate.localeCompare(b.dueDate);
        case 'due_desc':
          return b.dueDate.localeCompare(a.dueDate);
        case 'time_asc': {
          const da = durationMs(a);
          const db = durationMs(b);
          if (da === -1) return 1;
          if (db === -1) return -1;
          return da - db;
        }
        case 'time_desc': {
          const da = durationMs(a);
          const db = durationMs(b);
          if (da === -1) return 1;
          if (db === -1) return -1;
          return db - da;
        }
        default:
          return 0;
      }
    });

    return result;
  }, [tasks, search, brand, status, delivery, changes, dateFrom, dateTo, sort]);

  return (
    <div className={styles.shell}>
      <Sidebar />

      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Task history</h1>
          <p className={styles.pageSubtitle}>
            Browse and filter through every task you&apos;ve been assigned
          </p>
        </header>

        <TaskHistoryFilters
          brands={brands}
          brand={brand}
          onBrandChange={setBrand}
          status={status}
          onStatusChange={setStatus}
          delivery={delivery}
          onDeliveryChange={setDelivery}
          changes={changes}
          onChangesChange={setChanges}
          sort={sort}
          onSortChange={setSort}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          search={search}
          onSearchChange={setSearch}
          onClearAll={handleClearAll}
          hasActiveFilters={hasActiveFilters}
        />

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
        ) : (
          <>
            <p className={styles.resultCount}>
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
            </p>

            {filteredTasks.length === 0 ? (
              <div className={styles.emptyState}>
                <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M3 9h18M8 3v4M16 3v4" />
                  <path d="M9 14l2 2 4-4" />
                </svg>
                <p className={styles.emptyTitle}>No tasks found</p>
                <p className={styles.emptySubtitle}>Try adjusting or clearing your filters</p>
                {hasActiveFilters && (
                  <button type="button" className={styles.emptyClearBtn} onClick={handleClearAll}>
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Task</th>
                      <th className={styles.th}>Brand / Client</th>
                      <th className={styles.th}>Status</th>
                      <th className={styles.th}>Delivery</th>
                      <th className={styles.th}>Due date</th>
                      <th className={styles.th}>Submitted</th>
                      <th className={styles.th}>Changes</th>
                      <th className={styles.th}>Time taken</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => {
                      const totalChanges = getTotalChangeCount(task);
                      const isDelivered = task.deliveryState === 'delivered';
                      const timeTaken = getTimeTaken(task);

                      return (
                        <tr
                          key={task.id}
                          className={styles.row}
                          onClick={() => handleOpenTask(task)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td className={styles.td}>
                            <p className={styles.title}>{task.title}</p>
                            <p className={styles.description}>{task.description}</p>
                          </td>
                          <td className={styles.td}>
                            <p className={styles.brand}>{task.brandName}</p>
                            <p className={styles.client}>{task.clientName}</p>
                          </td>
                          <td className={styles.td}>
                            <StatusBadge status={task.status} />
                          </td>
                          <td className={styles.td}>
                            <span
                              className={`${styles.deliveryTag} ${
                                isDelivered ? styles.delivered : styles.notDelivered
                              }`}
                            >
                              {isDelivered ? 'Delivered' : 'Not delivered'}
                            </span>
                          </td>
                          <td className={styles.td}>
                            <span className={styles.dueDate}>{formatDate(task.dueDate)}</span>
                          </td>
                          <td className={styles.td}>
                            <span className={styles.dueDate}>{formatDate(task.submittedAt)}</span>
                          </td>
                          <td className={styles.td}>
                            {totalChanges > 0 ? (
                              <span className={styles.changesTag}>{totalChanges}</span>
                            ) : (
                              <span className={styles.dash}>—</span>
                            )}
                          </td>
                          <td className={styles.td}>
                            {timeTaken ? (
                              <span className={styles.timeTag}>
                                <svg
                                  className={styles.timeIcon}
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.6"
                                >
                                  <circle cx="12" cy="12" r="9" />
                                  <path d="M12 7v5l3 3" />
                                </svg>
                                {timeTaken}
                                {!!task.currentSessionStartedAt && (
                                  <span style={{ marginLeft: 4, color: '#1d4ed8' }}>●</span>
                                )}
                              </span>
                            ) : (
                              <span className={styles.dash}>—</span>
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
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={handleCloseModal}
          onSubmitTask={handleSubmitTask}
          onSubmitChangeResponses={handleSubmitChangeResponses}
        />
      )}
    </div>
  );
}