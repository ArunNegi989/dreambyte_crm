import React from 'react';
import { Task, CATEGORY_META } from '../../../types/seodashboard/task';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import RankChip from './RankChip';
import styles from '../../../assets/styles/seodashboard/TaskTable.module.css';

interface TaskTableProps {
  tasks: Task[];
  onOpen: (task: Task) => void;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function TaskTable({ tasks, onOpen }: TaskTableProps) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Task</th>
            <th className={styles.th}>Category</th>
            <th className={styles.th}>Client / brand</th>
            <th className={styles.th}>Due date</th>
            <th className={styles.th}>Priority</th>
            <th className={styles.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const overdue = task.status !== 'completed' && task.dueDate < today;
            return (
              <tr key={task.id} className={styles.row} onClick={() => onOpen(task)}>
                <td className={styles.td}>
                  <p className={styles.title}>{task.title}</p>
                  <p className={styles.desc}>{task.description}</p>
                </td>
                <td className={styles.td}>
                  <span className={styles.categoryTag}>{CATEGORY_META[task.category].shortLabel}</span>
                  {task.category === 'website_ranking' && task.details?.website_ranking?.[0] && (
                    <div className={styles.rankPreview}>
                      <RankChip
                        previousRank={task.details.website_ranking[0].previousRank}
                        currentRank={task.details.website_ranking[0].currentRank}
                      />
                    </div>
                  )}
                </td>
                <td className={styles.td}>
                  <p className={styles.brand}>{task.brandName}</p>
                  <p className={styles.client}>{task.clientName}</p>
                </td>
                <td className={styles.td}>
                  <span className={overdue ? styles.overdueDate : styles.dueDate}>{formatDate(task.dueDate)}</span>
                </td>
                <td className={styles.td}>
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className={styles.td}>
                  <StatusBadge status={task.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
