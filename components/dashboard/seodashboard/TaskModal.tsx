"use client";

import React, { useMemo, useState } from 'react';
import { Task, TaskStatus, CATEGORY_META } from '../../../types/seodashboard/task';
import { CATEGORY_FIELD_CONFIG, FieldDef } from './taskFieldConfig';
import DynamicField from './DynamicField';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import RankChip from './RankChip';
import styles from '../../../assets/styles/seodashboard/TaskModal.module.css';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onSave: (taskId: string, payload: { status: TaskStatus; remarks: string; details: any }) => Promise<void> | void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'blocked', label: 'Blocked' },
];

function emptyRow(fields: FieldDef[]): Record<string, any> {
  const row: Record<string, any> = { id: `row_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` };
  fields.forEach((f) => {
    row[f.name] = f.type === 'multiselect' ? [] : '';
  });
  return row;
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TaskModal({ task, onClose, onSave }: TaskModalProps) {
  const config = CATEGORY_FIELD_CONFIG[task.category];
  const meta = CATEGORY_META[task.category];

  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [remarks, setRemarks] = useState(task.remarks || '');
  const [saving, setSaving] = useState(false);

  const initialDetail = (task.details as any)?.[task.category];
  const [singleDetail, setSingleDetail] = useState<Record<string, any>>(
    !config.isList ? (initialDetail || {}) : {}
  );
  const [rows, setRows] = useState<Record<string, any>[]>(
    config.isList ? (Array.isArray(initialDetail) ? initialDetail : []) : []
  );

  const overdue = useMemo(
    () => task.status !== 'completed' && task.dueDate < new Date().toISOString().slice(0, 10),
    [task]
  );

  const updateSingleField = (name: string, value: any) => {
    setSingleDetail((prev) => ({ ...prev, [name]: value }));
  };

  const updateRowField = (rowId: string, name: string, value: any) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [name]: value } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow(config.fields)]);
  const removeRow = (rowId: string) => setRows((prev) => prev.filter((r) => r.id !== rowId));

  const handleSave = async () => {
    setSaving(true);
    try {
      const details = { [task.category]: config.isList ? rows : singleDetail };
      await onSave(task.id, { status, remarks, details });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <span className={styles.categoryTag}>{meta.label}</span>
            <h2 className={styles.title}>{task.title}</h2>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.description}>{task.description}</p>

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Client / Brand</span>
              <span className={styles.metaValue}>{task.brandName} · {task.clientName}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Assigned</span>
              <span className={styles.metaValue}>{formatDate(task.assignedDate)}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Due date</span>
              <span className={`${styles.metaValue} ${overdue ? styles.overdueText : ''}`}>
                {formatDate(task.dueDate)}{overdue ? ' (overdue)' : ''}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Priority</span>
              <PriorityBadge priority={task.priority} />
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Current status</span>
              <StatusBadge status={task.status} />
            </div>
          </div>

          <hr className={styles.divider} />

          <h3 className={styles.sectionTitle}>{meta.label} details</h3>

          {config.isList ? (
            <div className={styles.rowsWrap}>
              {rows.length === 0 && <p className={styles.emptyRows}>{config.emptyRowLabel}</p>}

              {rows.map((row, idx) => (
                <div key={row.id} className={styles.rowCard}>
                  <div className={styles.rowCardHeader}>
                    <span className={styles.rowIndex}>#{idx + 1}</span>
                    {task.category === 'website_ranking' && (
                      <RankChip previousRank={row.previousRank} currentRank={row.currentRank} />
                    )}
                    <button type="button" className={styles.removeRowBtn} onClick={() => removeRow(row.id)}>
                      Remove
                    </button>
                  </div>
                  <div className={styles.fieldGrid}>
                    {config.fields.map((field) => (
                      <div key={field.name} className={styles.field}>
                        <label className={styles.fieldLabel}>{field.label}</label>
                        <DynamicField
                          field={field}
                          value={row[field.name]}
                          onChange={(value) => updateRowField(row.id, field.name, value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button type="button" className={styles.addRowBtn} onClick={addRow}>
                + {config.addLabel}
              </button>
            </div>
          ) : (
            <div className={styles.fieldGrid}>
              {config.fields.map((field) => (
                <div key={field.name} className={styles.field}>
                  <label className={styles.fieldLabel}>{field.label}</label>
                  <DynamicField
                    field={field}
                    value={singleDetail[field.name]}
                    onChange={(value) => updateSingleField(field.name, value)}
                  />
                </div>
              ))}
            </div>
          )}

          <hr className={styles.divider} />

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Update status</label>
            <select className={styles.select} value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Remarks (optional)</label>
            <textarea
              className={styles.textarea}
              rows={2}
              placeholder="Anything blocking you, or context for whoever reviews this next…"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save update'}
          </button>
        </div>
      </div>
    </div>
  );
}
