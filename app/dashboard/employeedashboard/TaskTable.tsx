import React from 'react';
import { Task } from '../../../types/employee/task';
import { getTimeTaken, getTotalChangeCount } from '../../../data/employee/taskTimeHelpers';
import StatusBadge from '../../../components/dashboard/employeedashboard/StatusBadge';
import styles from '../../../assets/styles/employeedashboard/TaskTable.module.css';

interface TaskTableProps {
  tasks: Task[];
  onOpen: (task: Task) => void;
}

const TaskTable: React.FC<TaskTableProps> = ({ tasks, onOpen }) => {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Task</th>
            <th className={styles.th}>Brand / Client</th>
            <th className={styles.th}>Status</th>
            <th className={styles.th}>Delivery</th>
            <th className={styles.th}>Due date</th>
            <th className={styles.th}>Changes</th>
            <th className={styles.th}>Time taken</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onOpen={onOpen} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface TaskRowProps {
  task: Task;
  onOpen: (task: Task) => void;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, onOpen }) => {
  const totalChanges = getTotalChangeCount(task);
  const isDelivered = task.deliveryState === 'delivered';
  const timeTaken = getTimeTaken(task);

  return (
    <tr className={styles.row} onClick={() => onOpen(task)} tabIndex={0} role="button">
      <td className={styles.td}>
        <p className={styles.title}>{task.title}</p>
        <p className={styles.description}>{task.description}</p>
      </td>
      <td className={styles.td}>
        <p className={styles.brand}>{task.brandName}</p>
        <p className={styles.client}>{task.clientName}</p>
      </td>
      <td className={styles.td}>
        <StatusBadge status={task.status} />
      </td>
      <td className={styles.td}>
        <span className={`${styles.deliveryTag} ${isDelivered ? styles.delivered : styles.notDelivered}`}>
          {isDelivered ? 'Delivered' : 'Not delivered'}
        </span>
      </td>
      <td className={styles.td}>
        <span className={styles.dueDate}>{formatDate(task.dueDate)}</span>
      </td>
      <td className={styles.td}>
        {totalChanges > 0 ? (
          <span className={styles.changesTag}>{totalChanges}</span>
        ) : (
          <span className={styles.dash}>—</span>
        )}
      </td>
      <td className={styles.td}>
        {timeTaken ? (
          <span className={styles.timeTag}>
            <svg className={styles.timeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            {timeTaken}
          </span>
        ) : (
          <span className={styles.dash}>—</span>
        )}
      </td>
    </tr>
  );
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default TaskTable;