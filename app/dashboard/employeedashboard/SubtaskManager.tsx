"use client";

import React, { useState } from 'react';
import { useSubtasks } from '../../../hooks/employee/useSubtasks';
import styles from '../../../assets/styles/employeedashboard/SubtaskManager.module.css';

interface SubtaskManagerProps {
  taskId: string;
  // 'compact' is used inline in the task table (tighter spacing),
  // 'full' is used inside the task modal.
  variant?: 'compact' | 'full';
}

const SubtaskManager: React.FC<SubtaskManagerProps> = ({ taskId, variant = 'full' }) => {
  const { subtasks, addSubtask, toggleSubtask, removeSubtask } = useSubtasks(taskId);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const completedCount = subtasks.filter((s) => s.status === 'completed').length;

  const handleAdd = () => {
    if (!draft.trim()) {
      setAdding(false);
      return;
    }
    addSubtask(draft);
    setDraft('');
    setAdding(false);
  };

  return (
    // stopPropagation so clicking inside this widget doesn't also trigger a
    // parent row's onClick (which opens the task modal)
    <div
      className={`${styles.wrap} ${variant === 'compact' ? styles.compact : ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={styles.header}>
        <span className={styles.title}>
          Subtasks
          {subtasks.length > 0 && (
            <span className={styles.count}>{completedCount}/{subtasks.length}</span>
          )}
        </span>
        {!adding && (
          <button type="button" className={styles.addBtn} onClick={() => setAdding(true)}>
            + Add
          </button>
        )}
      </div>

      {adding && (
        <div className={styles.addRow}>
          <input
            autoFocus
            type="text"
            className={styles.input}
            placeholder="e.g. Wire up the login API"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') {
                setAdding(false);
                setDraft('');
              }
            }}
          />
          <button type="button" className={styles.saveBtn} onClick={handleAdd}>
            Save
          </button>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => {
              setAdding(false);
              setDraft('');
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {subtasks.length > 0 ? (
        <ul className={styles.list}>
          {subtasks.map((s) => (
            <li key={s.id} className={styles.item}>
              <button
                type="button"
                className={`${styles.statusBtn} ${
                  s.status === 'completed' ? styles.statusCompleted : styles.statusPending
                }`}
                onClick={() => toggleSubtask(s.id)}
                title="Click to toggle status"
              >
                {s.status === 'completed' ? 'Completed' : 'Pending'}
              </button>
              <span className={`${styles.itemTitle} ${s.status === 'completed' ? styles.itemTitleDone : ''}`}>
                {s.title}
              </span>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeSubtask(s.id)}
                title="Remove subtask"
                aria-label="Remove subtask"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        !adding && <p className={styles.emptyHint}>No subtasks yet</p>
      )}
    </div>
  );
};

export default SubtaskManager;