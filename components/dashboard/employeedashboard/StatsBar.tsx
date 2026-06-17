import React from 'react';
import { DashboardStats } from '../../../types/employee/task';
import styles from '../../../assets/styles/employeedashboard/StatsBar.module.css';

interface StatsBarProps {
  stats: DashboardStats;
}

const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  const overallItems = [
    { label: 'Total assigned', value: stats.overall.totalAssigned, variant: 'neutral' as const },
    { label: 'Pending', value: stats.overall.pending, variant: 'pending' as const },
    { label: 'Changes requested', value: stats.overall.changesRequested, variant: 'changes' as const },
    { label: 'Completed', value: stats.overall.completed, variant: 'completed' as const },
    { label: 'Not delivered', value: stats.overall.notDelivered, variant: 'notDelivered' as const },
  ];

  const periodItems = [
    { label: 'Today', due: stats.today.due, submitted: stats.today.submitted },
    { label: 'This week', due: stats.thisWeek.due, submitted: stats.thisWeek.submitted },
    { label: 'This month', due: stats.thisMonth.due, submitted: stats.thisMonth.submitted },
  ];

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        {overallItems.map((item) => (
          <div key={item.label} className={styles.statCard}>
            <p className={styles.label}>{item.label}</p>
            <p className={`${styles.value} ${styles[item.variant]}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className={styles.periodBar}>
        {periodItems.map((item) => (
          <div key={item.label} className={styles.periodCard}>
            <p className={styles.periodLabel}>{item.label}</p>
            <div className={styles.periodNumbers}>
              <div className={styles.periodStat}>
                <span className={styles.periodValue}>{item.due}</span>
                <span className={styles.periodTag}>due</span>
              </div>
              <div className={styles.periodDivider} />
              <div className={styles.periodStat}>
                <span className={`${styles.periodValue} ${styles.submittedValue}`}>{item.submitted}</span>
                <span className={styles.periodTag}>submitted</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsBar;