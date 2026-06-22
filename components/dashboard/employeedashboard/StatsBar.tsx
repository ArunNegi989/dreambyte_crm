import React from 'react';
import { DashboardStats } from '../../../types/employee/task';
import styles from '../../../assets/styles/employeedashboard/StatsBar.module.css';

interface StatsBarProps {
  stats: DashboardStats;
}

const RADIUS = 30;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  const { overall, today, thisWeek, thisMonth } = stats;

  const doneCount = overall.completed + overall.approved;
  const progressPct = overall.totalAssigned > 0
    ? Math.round((doneCount / overall.totalAssigned) * 100)
    : 0;
  const dashOffset = CIRCUMFERENCE - (progressPct / 100) * CIRCUMFERENCE;

  return (
    <div className={styles.wrap}>
      <div className={styles.heroRow}>
        <div className={styles.progressCard}>
          <div className={styles.ringWrap}>
            <svg viewBox="0 0 72 72" className={styles.ringSvg}>
              <circle cx="36" cy="36" r={RADIUS} className={styles.ringTrack} strokeWidth="7" fill="none" />
              <circle
                cx="36"
                cy="36"
                r={RADIUS}
                className={styles.ringProgress}
                strokeWidth="7"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className={styles.ringLabel}>{progressPct}%</div>
          </div>
          <div>
            <p className={styles.progressLabel}>Overall progress</p>
            <p className={styles.progressDetail}>
              {overall.pending} pending &middot; {overall.changesRequested} need changes &middot; {doneCount} done
            </p>
          </div>
        </div>

        <div className={styles.quickCard}>
          <div className={styles.quickRow}>
            <span className={styles.quickLabel}>Due today</span>
            <span className={styles.quickValue}>{today.due}</span>
          </div>
          <div className={styles.quickRow}>
            <span className={styles.quickLabel}>Submitted today</span>
            <span className={`${styles.quickValue} ${styles.quickValueGreen}`}>{today.submitted}</span>
          </div>
          <div className={styles.quickRow}>
            <span className={styles.quickLabel}>Not delivered</span>
            <span className={`${styles.quickValue} ${styles.quickValueAmber}`}>{overall.notDelivered}</span>
          </div>
        </div>
      </div>

      <div className={styles.periodLine}>
        <span className={styles.periodItem}>
          <svg className={styles.periodIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 9h18M8 3v4M16 3v4" />
            <circle cx="12" cy="14" r="2" fill="currentColor" stroke="none" />
          </svg>
          This week: <strong>{thisWeek.due} due / {thisWeek.submitted} submitted</strong>
        </span>
        <span className={styles.periodItem}>
          <svg className={styles.periodIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 9h18M8 3v4M16 3v4" />
          </svg>
          This month: <strong>{thisMonth.due} due / {thisMonth.submitted} submitted</strong>
        </span>
      </div>
    </div>
  );
};

export default StatsBar;