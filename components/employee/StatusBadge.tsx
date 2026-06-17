import React from 'react';
import { TaskStatus } from '../../types/employee/task';
import { STATUS_LABELS } from '../../data/employee/taskStats';
import styles from '../../assets/styles/employeedashboard/StatusBadge.module.css';

interface StatusBadgeProps {
  status: TaskStatus;
}

const STATUS_CLASS: Record<TaskStatus, string> = {
  pending: 'pending',
  changes_requested: 'changes',
  completed: 'completed',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span className={`${styles.badge} ${styles[STATUS_CLASS[status]]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
};

export default StatusBadge;