import React, { useState } from 'react';
import { Task, CATEGORY_META, getTimeTakenLabel } from '../../../types/seodashboard/task';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import RankChip from './RankChip';
import styles from '../../../assets/styles/seodashboard/TaskTable.module.css';

interface TaskTableProps {
  tasks: Task[];
  onOpen: (task: Task) => void;
  onStartTask?: (task: Task) => void | Promise<void>;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function TaskTable({ tasks, onOpen, onStartTask }: TaskTableProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [startingId, setStartingId] = useState<string | null>(null);

  const handleStartClick = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation(); // don't also open the task modal
    if (!onStartTask || startingId) return;
    setStartingId(task.id);
    try {
      await onStartTask(task);
    } finally {
      setStartingId(null);
    }
  };

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
            <th className={styles.th}>Time taken</th>
            <th className={styles.th}></th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const overdue = task.status !== 'completed' && task.dueDate < today;
            const timeTaken = getTimeTakenLabel(task.startedAt, task.deliveredAt);
            const isRunning = task.status === 'in_progress' && !task.deliveredAt;

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
                <td className={styles.td}>
                  {timeTaken ? (
                    <span style={{ fontSize: '0.8rem', color: isRunning ? '#1d4ed8' : '#475569' }}>
                      {timeTaken}
                      {isRunning ? ' (running)' : ''}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>—</span>
                  )}
                </td>
                <td className={styles.td}>
                  {task.status === 'pending' && onStartTask && (
                    <button
                      type="button"
                      onClick={(e) => handleStartClick(e, task)}
                      disabled={startingId === task.id}
                      style={{
                        background: '#4338ca',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        cursor: startingId === task.id ? 'not-allowed' : 'pointer',
                        opacity: startingId === task.id ? 0.6 : 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {startingId === task.id ? 'Starting…' : 'Start Task'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}