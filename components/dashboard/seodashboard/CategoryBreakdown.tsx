import React from 'react';
import { CATEGORY_META, SeoCategory } from '../../../types/seodashboard/task';
import styles from '../../../assets/styles/seodashboard/CategoryBreakdown.module.css';

interface CategoryBreakdownProps {
  data: { category: SeoCategory; count: number }[];
}

export default function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className={styles.wrap}>
      {data.map((d) => (
        <div key={d.category} className={styles.row}>
          <span className={styles.label}>{CATEGORY_META[d.category].label}</span>
          <div className={styles.track}>
            <div className={styles.fill} style={{ width: `${(d.count / max) * 100}%` }} />
          </div>
          <span className={styles.count}>{d.count}</span>
        </div>
      ))}
    </div>
  );
}
