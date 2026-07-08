"use client";

// components/dashboard/metadashboard/TaskModal.tsx
import React, { useState } from 'react';
import { CATEGORY_META, Task, TaskStatus } from '../../../data/metadashboard/dummyData';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onSave: (taskId: string, payload: { status: TaskStatus; remarks: string }) => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'blocked', label: 'Blocked' },
];

export default function TaskModal({ task, onClose, onSave }: TaskModalProps) {
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [remarks, setRemarks] = useState(task.remarks || '');
  const cat = CATEGORY_META[task.category];

  // Status changes save immediately — so the dashboard's counts (assigned /
  // pending / in progress / completed) update the moment someone marks a
  // task, without waiting for "Save changes" to be clicked.
  const handleStatusChange = (newStatus: TaskStatus) => {
    setStatus(newStatus);
    onSave(task.id, { status: newStatus, remarks });
  };

  // "Save changes" still exists to persist remarks (and re-confirm status)
  // before closing the modal.
  const handleSave = () => {
    onSave(task.id, { status, remarks });
    onClose();
  };

  return (
    <div className="md-overlay" onClick={onClose}>
      <div className="md-modal" onClick={(e) => e.stopPropagation()}>
        <div className="md-modal-header">
          <div>
            <span className="md-chip" style={{ color: cat.color, background: `${cat.color}1a` }}>{cat.label}</span>
            <h2 className="md-modal-title">{task.title}</h2>
          </div>
          <button type="button" className="md-modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="md-modal-body">
          <p className="md-modal-desc">{task.description}</p>

          <div className="md-detail-grid">
            <div className="md-detail-item">
              <span className="md-detail-key">Assigned to</span>
              <span className="md-detail-val">{task.assignedTo}</span>
            </div>
            <div className="md-detail-item">
              <span className="md-detail-key">Due date</span>
              <span className="md-detail-val">{task.dueDate}</span>
            </div>
            {Object.entries(task.details).map(([key, value]) => (
              <div className="md-detail-item" key={key}>
                <span className="md-detail-key">{key}</span>
                <span className="md-detail-val">{value}</span>
              </div>
            ))}
          </div>

          <div className="md-field">
            <label className="md-field-label">Status</label>
            <select className="md-select" value={status} onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="md-field">
            <label className="md-field-label">Remarks</label>
            <textarea
              className="md-textarea"
              placeholder="Add a note about progress or blockers…"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        <div className="md-modal-footer">
          <button type="button" className="md-btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="md-btn-primary" onClick={handleSave}>Save changes</button>
        </div>
      </div>
    </div>
  );
}