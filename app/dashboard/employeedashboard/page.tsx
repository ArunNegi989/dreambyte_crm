"use client"

import React, { useMemo, useState } from 'react';
import { Task, DeliveryState } from '../../../types/employee/task';
import { MOCK_TASKS } from '../../../data/employee/mockTasks';
import { computeDashboardStats, groupTasksByDueDate } from '../../../data/employee/taskStats';
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
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 10);
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const now = useMemo(() => new Date(), []);
  const stats = useMemo(() => computeDashboardStats(tasks, now), [tasks, now]);

  const visibleTasks = useMemo(() => {
    let result = tasks;
    if (activeFilter !== 'all') {
      result = result.filter((t) => t.status === activeFilter);
    }
    if (selectedDate) {
      result = result.filter((t) => t.dueDate === selectedDate);
    }
    return result;
  }, [tasks, activeFilter, selectedDate]);

  const groupedTasks = useMemo(() => groupTasksByDueDate(visibleTasks, now), [visibleTasks, now]);

  const hasActiveFilters = activeFilter !== 'all' || selectedDate !== '';

  const handleClearFilters = () => {
    setActiveFilter('all');
    setSelectedDate('');
  };

  const handleOpenTask = (task: Task) => setSelectedTask(task);
  const handleCloseModal = () => setSelectedTask(null);

  const handleSubmitTask = (
    taskId: string,
    deliveryState: DeliveryState,
    remarks: string,
    startedAt: string
  ) => {
    const nowTimestamp = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              deliveryState,
              remarks,
              submittedAt: nowTimestamp.slice(0, 10),
              startedAt,
              completedAt: nowTimestamp,
              status: 'completed',
            }
          : t
      )
    );
    setSelectedTask(null);
  };

  const handleSubmitChangeResponses = (
    taskId: string,
    deliveryState: DeliveryState,
    remarks: string,
    responses: { id: string; response: string }[]
  ) => {
    const submittedAt = new Date().toISOString().slice(0, 10);
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const updatedChangeRequests = t.changeRequests.map((c) => {
          const match = responses.find((r) => r.id === c.id);
          return match ? { ...c, employeeResponse: match.response, resolved: true } : c;
        });
        return {
          ...t,
          status: 'pending',
          deliveryState,
          remarks,
          submittedAt,
          changeRequests: updatedChangeRequests,
        };
      })
    );
    setSelectedTask(null);
  };

  return (
    <div className={styles.shell}>
      <Sidebar />

      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>My tasks</h1>
          <p className={styles.pageSubtitle}>Track, submit, and resolve feedback on your assigned tasks</p>
        </header>

        <StatsBar stats={stats} />

        <div className={styles.filterRow}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`${styles.filterBtn} ${activeFilter === f.value ? styles.filterBtnActive : ''}`}
              onClick={() => setActiveFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
          <div className={styles.dateFilterSlot}>
            <DateFilter value={selectedDate} onChange={setSelectedDate} />
          </div>
        </div>

        {groupedTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 9h18M8 3v4M16 3v4" />
              <path d="M9 14l2 2 4-4" />
            </svg>
            <p className={styles.emptyTitle}>No tasks here</p>
            <p className={styles.emptySubtitle}>Nothing matches this filter right now</p>
            {hasActiveFilters && (
              <button className={styles.emptyClearBtn} onClick={handleClearFilters}>
                Clear filters
              </button>
            )}
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
          <TaskModal
            task={selectedTask}
            onClose={handleCloseModal}
            onSubmitTask={handleSubmitTask}
            onSubmitChangeResponses={handleSubmitChangeResponses}
          />
        )}
      </div>
    </div>
  );
}