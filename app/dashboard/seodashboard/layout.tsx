"use client";

import React from 'react';
import '../../../assets/styles/seodashboard/seo-globals.css';
import Sidebar from '../../../components/dashboard/seodashboard/Sidebar';
import { useAuthGuard } from '../../../hooks/useAuthGuard';
import styles from '../../../assets/styles/seodashboard/Layout.module.css';

export default function SeoDashboardLayout({ children }: { children: React.ReactNode }) {
  useAuthGuard(['employee', 'admin', 'super_admin'], ['seo']); // ⚠️ confirm 'seo' matches DB value

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.page}>{children}</div>
    </div>
  );
}