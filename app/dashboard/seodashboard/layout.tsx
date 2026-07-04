"use client";

import React from 'react';
import '../../../assets/styles/seodashboard/seo-globals.css';
import Sidebar from '../../../components/dashboard/seodashboard/Sidebar';
import { useAuthGuard } from '../../../hooks/useAuthGuard';
import styles from '../../../assets/styles/seodashboard/Layout.module.css';

export default function SeoDashboardLayout({ children }: { children: React.ReactNode }) {
  // useAuthGuard(['seo']); // guard this whole segment the same way the employee dashboard does

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.page}>{children}</div>
    </div>
  );
}
