"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { AdditionalTask, CATEGORY_META } from '../../../../types/seodashboard/task';
import { getAdditionalTasks, addAdditionalTask, updateAdditionalTask, deleteAdditionalTask, markAdditionalWorkDone } from '../../../api/seoApi';
import AdditionalTaskModal from '../../../../components/dashboard/seodashboard/AdditionalTaskModal';
import styles from '../../../../assets/styles/seodashboard/AdditionalTasks.module.css';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdditionalTasksPage() {
  const [items, setItems] = useState<AdditionalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdditionalTask | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markError, setMarkError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const fetched = await getAdditionalTasks();
      setItems(fetched);
    } catch (err: any) {
      setError(err.message || 'Failed to load additional tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (item: AdditionalTask) => { setEditing(item); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);

  const handleSave = async (payload: Omit<AdditionalTask, 'id' | 'createdAt'>) => {
    if (editing) {
      await updateAdditionalTask(editing.id, payload);
    } else {
      await addAdditionalTask(payload);
    }
    fetchData();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteAdditionalTask(id);
    fetchData();
  };

  // Marks a single entry as done without opening the edit modal.
  // Optimistic update for instant feedback, then re-syncs from the server.
  const handleMarkDone = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (markingId) return;
    setMarkingId(id);
    setMarkError('');
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: 'completed' } : it)));
    try {
      await markAdditionalWorkDone(id);
      await fetchData();
    } catch (err: any) {
      setMarkError(err.message || 'Failed to mark as done');
      await fetchData(); // roll back optimistic update to real state
    } finally {
      setMarkingId(null);
    }
  };

  const totalHours = items.reduce((sum, i) => sum + (typeof i.hoursSpent === 'number' ? i.hoursSpent : 0), 0);

  return (
    <div>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Additional tasks</h1>
          <p className={styles.subtitle}>Log work you did that wasn&apos;t on your assigned task list</p>
        </div>
        <button type="button" className={styles.addBtn} onClick={openNew}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Log work
        </button>
      </header>

      <div className={styles.summaryRow}>
        <span className={styles.summaryChip}>{items.length} entries logged</span>
        <span className={styles.summaryChip}>{totalHours} hrs total</span>
      </div>

      {markError && (
        <p style={{ color: '#b91c1c', fontSize: 12.5, fontWeight: 500, marginBottom: 12 }}>{markError}</p>
      )}

      {loading ? (
        <p className={styles.emptyText}>Loading…</p>
      ) : error ? (
        <div className={styles.errorBox}>
          <p>{error}</p>
          <button type="button" onClick={fetchData} className={styles.retryBtn}>Retry</button>
        </div>
      ) : items.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>Nothing logged yet</p>
          <p className={styles.emptyText}>Did something outside your assigned tasks? Log it so it counts toward your work.</p>
          <button type="button" className={styles.addBtn} onClick={openNew}>Log your first entry</button>
        </div>
      ) : (
        <div className={styles.list}>
          {items.map((item) => {
            const isDone = item.status === 'completed';
            return (
              <div key={item.id} className={styles.card} onClick={() => openEdit(item)}>
                <div className={styles.cardHeader}>
                  <div>
                    {item.category && item.category !== 'other' && (
                      <span className={styles.categoryTag}>{CATEGORY_META[item.category].label}</span>
                    )}
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isDone ? (
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: '#15803d',
                          background: '#dcfce7',
                          padding: '4px 10px',
                          borderRadius: 999,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Completed
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleMarkDone(item.id, e)}
                        disabled={markingId === item.id}
                        style={{
                          border: '1px solid #e2e8f0',
                          background: '#fff',
                          color: '#0f172a',
                          padding: '4px 10px',
                          fontSize: 11.5,
                          fontWeight: 600,
                          borderRadius: 999,
                          cursor: markingId === item.id ? 'not-allowed' : 'pointer',
                          opacity: markingId === item.id ? 0.6 : 1,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {markingId === item.id ? 'Marking…' : 'Mark as done'}
                      </button>
                    )}
                    <button type="button" className={styles.deleteBtn} onClick={(e) => handleDelete(item.id, e)} aria-label="Delete entry">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="15" height="15">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className={styles.cardDesc}>{item.description}</p>
                {item.outcome && <p className={styles.cardOutcome}>Outcome: {item.outcome}</p>}
                <div className={styles.cardFooter}>
                  <span>{formatDate(item.date)}</span>
                  {item.hoursSpent !== '' && <span>{item.hoursSpent} hrs</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <AdditionalTaskModal initial={editing} onClose={closeModal} onSave={handleSave} />
      )}
    </div>
  );
}