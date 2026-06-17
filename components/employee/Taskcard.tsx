import React from 'react';
import { Task } from '../../types/employee/task';
import StatusBadge from './StatusBadge';
import styles from '../../assets/styles/employeedashboard/TaskCard.module.css';

interface TaskCardProps {
  task: Task;
  onOpen: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onOpen }) => {
  const unresolvedChanges = task.changeRequests.filter((c) => !c.resolved).length;
  const isDelivered = task.deliveryState === 'delivered';

  return (
    <div className={styles.card} onClick={() => onOpen(task)} role="button" tabIndex={0}>
      <div className={styles.cardHeader}>
        <div className={styles.brandClient}>
          <span className={styles.brand}>{task.brandName}</span>
          <span className={styles.client}>{task.clientName}</span>
        </div>
        <StatusBadge status={task.status} />
      </div>

      <h3 className={styles.title}>{task.title}</h3>
      <p className={styles.description}>{task.description}</p>

      <div className={styles.footer}>
        <span className={styles.dueDate}>
          <svg className={styles.dueIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 9h18M8 3v4M16 3v4" />
          </svg>
          Due {formatDate(task.dueDate)}
        </span>
        <div className={styles.tagGroup}>
          <span className={`${styles.deliveryTag} ${isDelivered ? styles.delivered : styles.notDelivered}`}>
            {isDelivered ? 'Delivered' : 'Not delivered'}
          </span>
          {unresolvedChanges > 0 && (
            <span className={styles.changesTag}>
              {unresolvedChanges} change{unresolvedChanges > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default TaskCard;