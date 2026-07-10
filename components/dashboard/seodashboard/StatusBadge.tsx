import React from 'react';
import { TaskStatus } from '../../../types/seodashboard/task';
import styles from '../../../assets/styles/seodashboard/StatusBadge.module.css';

const LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed',
  blocked: 'Blocked',
  rejected: 'Rejected',
};

const CLASS_MAP: Record<TaskStatus, string> = {
  pending: 'pending',
  in_progress: 'inProgress',
  completed: 'completed',
  blocked: 'blocked',
  rejected: 'rejected',
};

export default function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`${styles.badge} ${styles[CLASS_MAP[status]]}`}>
      <span className={styles.dot} />
      {LABELS[status]}
    </span>
  );
}
