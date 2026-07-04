"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { AdditionalTask, CATEGORY_META } from '../../../../types/seodashboard/task';
import { getAdditionalTasks, addAdditionalTask, updateAdditionalTask, deleteAdditionalTask } from '../../../api/seoApi';
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
          {items.map((item) => (
            <div key={item.id} className={styles.card} onClick={() => openEdit(item)}>
              <div className={styles.cardHeader}>
                <div>
                  {item.category && item.category !== 'other' && (
                    <span className={styles.categoryTag}>{CATEGORY_META[item.category].label}</span>
                  )}
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                </div>
                <button type="button" className={styles.deleteBtn} onClick={(e) => handleDelete(item.id, e)} aria-label="Delete entry">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="15" height="15">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
                  </svg>
                </button>
              </div>
              <p className={styles.cardDesc}>{item.description}</p>
              {item.outcome && <p className={styles.cardOutcome}>Outcome: {item.outcome}</p>}
              <div className={styles.cardFooter}>
                <span>{formatDate(item.date)}</span>
                {item.hoursSpent !== '' && <span>{item.hoursSpent} hrs</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <AdditionalTaskModal initial={editing} onClose={closeModal} onSave={handleSave} />
      )}
    </div>
  );
}
