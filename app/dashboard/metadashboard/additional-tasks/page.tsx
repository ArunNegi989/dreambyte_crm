"use client";

// app/dashboard/metadashboard/additional-tasks/page.tsx
import React, { useState } from 'react';
import {
  AdditionalTask,
  CATEGORY_META,
  CATEGORY_OPTIONS,
  DUMMY_ADDITIONAL_TASKS,
} from '../../../../data/metadashboard/dummyData';

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function AdditionalTasksPage() {
  const [items, setItems] = useState<AdditionalTask[]>(DUMMY_ADDITIONAL_TASKS);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('other');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayIso());
  const [hoursSpent, setHoursSpent] = useState<number | ''>('');
  const [outcome, setOutcome] = useState('');
  const [error, setError] = useState('');

  const resetForm = () => {
    setTitle(''); setCategory('other'); setDescription(''); setDate(todayIso());
    setHoursSpent(''); setOutcome(''); setError('');
  };

  const handleSave = () => {
    if (!title.trim() || !description.trim()) {
      setError('Give the work a title and a short description before saving.');
      return;
    }
    const newItem: AdditionalTask = {
      id: `a${Date.now()}`,
      title: title.trim(),
      category: category as AdditionalTask['category'],
      description: description.trim(),
      date,
      hoursSpent,
      outcome: outcome.trim(),
    };
    setItems((prev) => [newItem, ...prev]);
    resetForm();
    setShowForm(false);
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

      {items.length === 0 ? (
        <div className="md-empty">
          <p className="md-empty-title">Nothing logged yet</p>
          <p className="md-empty-text">Use "Log work" to record something useful you did outside your task list.</p>
        </div>
      ) : (
        <div className="md-list">
          {items.map((item) => {
            const cat = item.category === 'other' ? null : CATEGORY_META[item.category];
            return (
              <div className="md-list-card" key={item.id}>
                <div className="md-list-card-header">
                  <span
                    className="md-chip"
                    style={cat ? { color: cat.color, background: `${cat.color}1a` } : { color: 'var(--md-text-muted)', background: 'var(--md-surface)' }}
                  >
                    {cat ? cat.label : 'Other'}
                  </span>
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

              {error && <p style={{ color: 'var(--md-danger)', fontSize: 12.5, fontWeight: 500 }}>{error}</p>}
            </div>

            <div className="md-modal-footer">
              <button type="button" className="md-btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="button" className="md-btn-primary" onClick={handleSave}>Save entry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
