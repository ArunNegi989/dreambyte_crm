import React from 'react';
import styles from '../../../assets/styles/employeedashboard/DateFilter.module.css';

interface DateFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const DateFilter: React.FC<DateFilterProps> = ({ value, onChange }) => {
  return (
    <div className={styles.wrap}>
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 3v4M16 3v4" />
      </svg>
      <input
        type="date"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Filter tasks by date"
      />
      {value && (
        <button type="button" className={styles.clearBtn} onClick={() => onChange('')}>
          Clear
        </button>
      )}
    </div>
  );
};

export default DateFilter;