import React from 'react';
import styles from '../../../assets/styles/seodashboard/StatCard.module.css';

interface StatCardProps {
  label: string;
  value: string | number;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'primary';
  icon: React.ReactNode;
}

export default function StatCard({ label, value, tone = 'default', icon }: StatCardProps) {
  return (
    <div className={`${styles.card} ${styles[tone]}`}>
      <div className={styles.iconWrap}>{icon}</div>
      <div>
        <p className={styles.value}>{value}</p>
        <p className={styles.label}>{label}</p>
      </div>
    </div>
  );
}
