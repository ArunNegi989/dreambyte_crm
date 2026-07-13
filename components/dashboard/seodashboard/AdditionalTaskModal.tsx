"use client";

import React, { useState } from 'react';
import { AdditionalTask, CATEGORY_OPTIONS, SeoCategory } from '../../../types/seodashboard/task';
import styles from '../../../assets/styles/seodashboard/TaskModal.module.css';
import addStyles from '../../../assets/styles/seodashboard/AdditionalTaskModal.module.css';

interface AdditionalTaskModalProps {
  initial?: AdditionalTask | null;
  onClose: () => void;
  onSave: (payload: Omit<AdditionalTask, 'id' | 'createdAt'>) => Promise<void> | void;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function AdditionalTaskModal({ initial, onClose, onSave }: AdditionalTaskModalProps) {
  const [title, setTitle] = useState(initial?.title || '');
  const [category, setCategory] = useState<SeoCategory | 'other'>(initial?.category || 'other');
  const [description, setDescription] = useState(initial?.description || '');
  const [date, setDate] = useState(initial?.date || todayIso());
  const [hoursSpent, setHoursSpent] = useState<number | ''>(initial?.hoursSpent ?? '');
  const [outcome, setOutcome] = useState(initial?.outcome || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Give the work a title and a short description before saving.');
      return;
    }
    setSaving(true);
    setError('');
    try {
  await onSave({
    title: title.trim(),
    category,
    description: description.trim(),
    date,
    hoursSpent,
    outcome: outcome.trim(),
    status: initial?.status ?? 'pending',
  });
  onClose();
}finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} ${addStyles.narrow}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <span className={styles.categoryTag}>Additional work</span>
            <h2 className={styles.title}>{initial ? 'Edit logged work' : 'Log additional work'}</h2>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.description}>
            Did something useful outside your assigned task list? Log it here so it counts.
          </p>

          <div className={styles.fieldGrid}>
            <div className={addStyles.fieldFull}>
              <label className={styles.fieldLabel}>What did you work on?</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. Competitor backlink gap analysis"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Related category (optional)</label>
              <select className={styles.select} value={category} onChange={(e) => setCategory(e.target.value as SeoCategory | 'other')}>
                <option value="other">Other / not listed</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Date</label>
              <input type="date" className={styles.input} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Hours spent</label>
              <input
                type="number"
                step="0.5"
                min="0"
                className={styles.input}
                placeholder="e.g. 1.5"
                value={hoursSpent}
                onChange={(e) => setHoursSpent(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            <div className={addStyles.fieldFull}>
              <label className={styles.fieldLabel}>Description</label>
              <textarea
                className={styles.textarea}
                rows={3}
                placeholder="What exactly did you do?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className={addStyles.fieldFull}>
              <label className={styles.fieldLabel}>Outcome / result (optional)</label>
              <textarea
                className={styles.textarea}
                rows={2}
                placeholder="What came out of it?"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
              />
            </div>
          </div>

          {error && <p className={addStyles.error}>{error}</p>}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save entry'}
          </button>
        </div>
      </div>
    </div>
  );
}
