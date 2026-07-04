import React from 'react';
import { Priority } from '../../../types/seodashboard/task';
import styles from '../../../assets/styles/seodashboard/PriorityBadge.module.css';

const LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`${styles.badge} ${styles[priority]}`}>{LABELS[priority]}</span>;
}
