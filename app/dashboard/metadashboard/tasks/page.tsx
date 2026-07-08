"use client";

// app/dashboard/metadashboard/tasks/page.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CATEGORY_META,
  CATEGORY_OPTIONS,
} from '../../../../data/metadashboard/dummyData';
import { Task } from '../../../../types/metadashboard/metaTask';
import TaskModal from '../../../../components/dashboard/metadashboard/TaskModal';
import { fetchMyTasks } from '../../../api/metaApi';

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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      return true;
    });
  }, [tasks, statusFilter, categoryFilter]);

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
              <p className="md-empty-text">Try a different status or category.</p>
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
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => {
                    const meta = CATEGORY_META[t.category as keyof typeof CATEGORY_META];
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
                        <td className="md-due">{t.dueDate || '—'}</td>
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