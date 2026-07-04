import React from 'react';
import styles from '../../../assets/styles/seodashboard/RankChip.module.css';

interface RankChipProps {
  previousRank: number | '';
  currentRank: number | '';
}

// The signature visual motif of this dashboard: every ranking figure is
// paired with a small directional chip so movement is legible at a glance,
// without needing a chart.
export default function RankChip({ previousRank, currentRank }: RankChipProps) {
  if (previousRank === '' || currentRank === '' || previousRank === currentRank) {
    return (
      <span className={`${styles.chip} ${styles.flat}`}>
        <span className={styles.arrow}>—</span>
        {currentRank === '' ? '—' : `#${currentRank}`}
      </span>
    );
  }

  const improved = currentRank < previousRank;
  const diff = Math.abs(Number(previousRank) - Number(currentRank));

  return (
    <span className={`${styles.chip} ${improved ? styles.up : styles.down}`}>
      <span className={styles.arrow}>{improved ? '▲' : '▼'}</span>
      #{currentRank}
      <span className={styles.diff}>{diff}</span>
    </span>
  );
}
