"use client";

// app/dashboard/metadashboard/additional-tasks/page.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  AdditionalTask,
  CATEGORY_META,
  CATEGORY_OPTIONS,
} from '../../../../data/metadashboard/dummyData';
import { fetchMyAdditionalWork, createAdditionalWork, markAdditionalWorkDone } from '../../../api/metaApi';

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function AdditionalTasksPage() {
  const [items, setItems] = useState<AdditionalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markError, setMarkError] = useState('');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('other');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayIso());
  const [hoursSpent, setHoursSpent] = useState<number | ''>('');
  const [outcome, setOutcome] = useState('');
  const [formError, setFormError] = useState('');

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

  const loadItems = useCallback(async () => {
    if (!employeeId) return;
    try {
      setLoading(true);
      setLoadError('');
      const fetched = await fetchMyAdditionalWork(employeeId);
      setItems(fetched);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load additional work');
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const resetForm = () => {
    setTitle(''); setCategory('other'); setDescription(''); setDate(todayIso());
    setHoursSpent(''); setOutcome(''); setFormError('');
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      setFormError('Give the work a title and a short description before saving.');
      return;
    }
    try {
      setSaving(true);
      setFormError('');
      await createAdditionalWork(employeeId, {
        title: title.trim(),
        category,
        description: description.trim(),
        date,
        hoursSpent,
        outcome: outcome.trim(),
      });
      resetForm();
      setShowForm(false);
      await loadItems();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  // Marks a single entry as done. Optimistically flips the local status so
  // the button/badge swaps instantly, then re-syncs from the server.
  const handleMarkDone = async (id: string) => {
    if (markingId) return;
    setMarkingId(id);
    setMarkError('');
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: 'completed' } : it)));
    try {
      await markAdditionalWorkDone(id);
      await loadItems();
    } catch (err: unknown) {
      setMarkError(err instanceof Error ? err.message : 'Failed to mark as done');
      await loadItems(); // roll back the optimistic update to the real state
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <div>
      <header className="md-header">
        <div>
          <h1 className="md-title">Additional tasks</h1>
          <p className="md-subtitle">Log work you did outside your assigned task list.</p>
        </div>
        <button type="button" className="md-add-btn" onClick={() => setShowForm(true)}>+ Log work</button>
      </header>

      {loading && <p className="md-empty-text">Loading…</p>}

      {!loading && loadError && (
        <div className="md-empty">
          <p className="md-empty-title">Couldn't load your entries</p>
          <p className="md-empty-text">{loadError}</p>
          <button type="button" className="md-btn-secondary" onClick={loadItems}>Retry</button>
        </div>
      )}

      {!loading && !loadError && markError && (
        <p style={{ color: 'var(--md-danger)', fontSize: 12.5, fontWeight: 500, marginBottom: 12 }}>{markError}</p>
      )}

      {!loading && !loadError && (
        items.length === 0 ? (
          <div className="md-empty">
            <p className="md-empty-title">Nothing logged yet</p>
            <p className="md-empty-text">Use "Log work" to record something useful you did outside your task list.</p>
          </div>
        ) : (
          <div className="md-list">
            {items.map((item) => {
              const cat = item.category === 'other' ? null : CATEGORY_META[item.category];
              const isDone = item.status === 'completed';
              return (
                <div className="md-list-card" key={item.id}>
                  <div className="md-list-card-header">
                    <span
                      className="md-chip"
                      style={cat ? { color: cat.color, background: `${cat.color}1a` } : { color: 'var(--md-text-muted)', background: 'var(--md-surface)' }}
                    >
                      {cat ? cat.label : 'Other'}
                    </span>
                    {isDone ? (
                      <span className="md-status completed">Completed</span>
                    ) : (
                      <button
                        type="button"
                        className="md-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        disabled={markingId === item.id}
                        onClick={() => handleMarkDone(item.id)}
                      >
                        {markingId === item.id ? 'Marking…' : 'Mark as done'}
                      </button>
                    )}
                  </div>
                  <p className="md-list-card-title">{item.title}</p>
                  <p className="md-list-card-desc">{item.description}</p>
                  {item.outcome && <p className="md-list-card-outcome">{item.outcome}</p>}
                  <div className="md-list-card-footer">
                    <span>{item.date}</span>
                    <span>{item.hoursSpent === '' ? '—' : `${item.hoursSpent}h`}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {showForm && (
        <div className="md-overlay" onClick={() => setShowForm(false)}>
          <div className="md-modal" onClick={(e) => e.stopPropagation()}>
            <div className="md-modal-header">
              <div>
                <span className="md-chip" style={{ color: 'var(--md-primary-dark)', background: 'var(--md-primary-soft)' }}>Additional work</span>
                <h2 className="md-modal-title">Log additional work</h2>
              </div>
              <button type="button" className="md-modal-close" onClick={() => setShowForm(false)} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="md-modal-body">
              <div className="md-field">
                <label className="md-field-label">What did you work on?</label>
                <input className="md-input" placeholder="e.g. Competitor ad research" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div className="md-field">
                <label className="md-field-label">Related category (optional)</label>
                <select className="md-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="other">Other / not listed</option>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="md-field">
                <label className="md-field-label">Date</label>
                <input type="date" className="md-input" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>

              <div className="md-field">
                <label className="md-field-label">Hours spent</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  className="md-input"
                  placeholder="e.g. 1.5"
                  value={hoursSpent}
                  onChange={(e) => setHoursSpent(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>

              <div className="md-field">
                <label className="md-field-label">Description</label>
                <textarea className="md-textarea" placeholder="What exactly did you do?" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div className="md-field">
                <label className="md-field-label">Outcome / result (optional)</label>
                <textarea className="md-textarea" placeholder="What came out of it?" value={outcome} onChange={(e) => setOutcome(e.target.value)} />
              </div>

              {formError && <p style={{ color: 'var(--md-danger)', fontSize: 12.5, fontWeight: 500 }}>{formError}</p>}
            </div>

            <div className="md-modal-footer">
              <button type="button" className="md-btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="button" className="md-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}