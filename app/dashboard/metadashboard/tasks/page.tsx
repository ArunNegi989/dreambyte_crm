"use client";

// app/dashboard/metadashboard/tasks/page.tsx
import React, { useMemo, useState } from 'react';
import {
  CATEGORY_META,
  CATEGORY_OPTIONS,
  DUMMY_TASKS,
  Task,
  TaskStatus,
} from '../../../../data/metadashboard/dummyData';
import TaskModal from '../../../../components/dashboard/metadashboard/TaskModal';

const STATUS_FILTERS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'blocked', label: 'Blocked' },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(DUMMY_TASKS);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      return true;
    });
  }, [tasks, statusFilter, categoryFilter]);

  const handleSaveTask = (taskId: string, payload: { status: TaskStatus; remarks: string }) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...payload } : t)));
  };

  return (
    <div>
      <header className="md-header">
        <div>
          <h1 className="md-title">Tasks</h1>
          <p className="md-subtitle">{filtered.length} of {tasks.length} tasks shown</p>
        </div>
      </header>

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
              {filtered.map((t) => (
                <tr key={t.id} className="clickable" onClick={() => setSelectedTask(t)}>
                  <td className="md-task-title">{t.title}</td>
                  <td>
                    <span
                      className="md-chip"
                      style={{ color: CATEGORY_META[t.category].color, background: `${CATEGORY_META[t.category].color}1a` }}
                    >
                      {CATEGORY_META[t.category].label}
                    </span>
                  </td>
                  <td><span className={`md-badge ${t.priority}`}>{t.priority}</span></td>
                  <td><span className={`md-status ${t.status}`}>{t.status.replace('-', ' ')}</span></td>
                  <td className="md-due">{t.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} onSave={handleSaveTask} />
      )}
    </div>
  );
}
