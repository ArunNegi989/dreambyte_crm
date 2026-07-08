"use client";

import React, { useMemo, useState } from 'react';
import { useAuthGuard } from '../../../../hooks/useAuthGuard';
import { useAdditionalTasks } from '../../../../hooks/employee/useAdditionalTasks';
import Sidebar from '../../../../components/dashboard/employeedashboard/Sidebar';
import styles from '../../../../assets/styles/employeedashboard/additionaltask.module.css';

type ViewFilter = 'all' | 'pending' | 'completed';

export default function AdditionalTasksPage() {
  useAuthGuard(['employee']);

  const { tasks, loaded, addTask, toggleStatus, removeTask } = useAdditionalTasks();
  const [filter, setFilter] = useState<ViewFilter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks;
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask(title, description, dueDate || null);
    setTitle('');
    setDescription('');
    setDueDate('');
    setFormOpen(false);
  };

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Additional tasks</h1>
            <p className={styles.pageSubtitle}>
              Your own tasks — not assigned by an admin. Break down a project into
              whatever you need to track.
            </p>
          </div>
          <button type="button" className={styles.newTaskBtn} onClick={() => setFormOpen((v) => !v)}>
            {formOpen ? 'Cancel' : '+ New task'}
          </button>
        </header>

        <p className={styles.localNote}>
          Saved on this device only (not synced to the server or visible to admins).
        </p>

        {formOpen && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              autoFocus
              type="text"
              className={styles.input}
              placeholder="Task title, e.g. Set up CI pipeline"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className={styles.textarea}
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
            <div className={styles.formRow}>
              <label className={styles.dateLabel}>
                Due date (optional)
                <input
                  type="date"
                  className={styles.dateInput}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </label>
              <button type="submit" className={styles.saveBtn}>Save task</button>
            </div>
          </form>
        )}

        <div className={styles.filterRow}>
          <FilterBtn label={`All (${tasks.length})`} active={filter === 'all'} onClick={() => setFilter('all')} />
          <FilterBtn label={`Pending (${pendingCount})`} active={filter === 'pending'} onClick={() => setFilter('pending')} />
          <FilterBtn label={`Completed (${completedCount})`} active={filter === 'completed'} onClick={() => setFilter('completed')} />
        </div>

        {!loaded ? (
          <p className={styles.emptySubtitle}>Loading…</p>
        ) : filteredTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>No tasks here</p>
            <p className={styles.emptySubtitle}>
              {tasks.length === 0
                ? 'Add your first ad-hoc task to get started.'
                : 'Nothing matches this filter right now.'}
            </p>
          </div>
        ) : (
          <ul className={styles.list}>
            {filteredTasks.map((task) => (
              <li key={task.id} className={styles.card}>
                <div className={styles.cardMain}>
                  <p className={`${styles.cardTitle} ${task.status === 'completed' ? styles.cardTitleDone : ''}`}>
                    {task.title}
                  </p>
                  {task.description && <p className={styles.cardDescription}>{task.description}</p>}
                  {task.dueDate && <p className={styles.cardDue}>Due {formatDate(task.dueDate)}</p>}
                </div>
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={`${styles.statusBtn} ${
                      task.status === 'completed' ? styles.statusCompleted : styles.statusPending
                    }`}
                    onClick={() => toggleStatus(task.id)}
                  >
                    {task.status === 'completed' ? 'Completed' : 'Pending'}
                  </button>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => removeTask(task.id)}
                    title="Delete task"
                    aria-label="Delete task"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const FilterBtn: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button
    type="button"
    className={`${styles.filterBtn} ${active ? styles.filterBtnActive : ''}`}
    onClick={onClick}
  >
    {label}
  </button>
);

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}