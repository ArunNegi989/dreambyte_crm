"use client"

import React, { useMemo } from 'react';
import { MOCK_PROFILE } from '../../../../data/employee/profile';
import { MOCK_TASKS } from '../../../../data/employee/mockTasks';
import { computeEmployeeStats } from '../../../../data/employee/taskStats';
import Sidebar from '../../../../components/dashboard/employeedashboard/Sidebar';
import styles from '../../../../assets/styles/employeedashboard/Profile.module.css';

export default function ProfilePage() {
  const stats = useMemo(() => computeEmployeeStats(MOCK_TASKS), []);
  const profile = MOCK_PROFILE;

  const joinDate = new Date(profile.joinDate);
  const now = new Date();
  const months =
    (now.getFullYear() - joinDate.getFullYear()) * 12 +
    (now.getMonth() - joinDate.getMonth());
  const tenure =
    months >= 12
      ? `${Math.floor(months / 12)} yr${Math.floor(months / 12) > 1 ? 's' : ''} ${months % 12 ? `${months % 12}m` : ''}`
      : `${months}m`;

  return (
    <div className={styles.shell}>
      <Sidebar />

      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Profile</h1>
          <p className={styles.pageSubtitle}>Your account details and task summary</p>
        </header>

        <div className={styles.layout}>
          {/* Left: identity card */}
          <div className={styles.identityCard}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatar}>{profile.initials}</div>
            </div>
            <h2 className={styles.name}>{profile.name}</h2>
            <p className={styles.role}>{profile.role}</p>
            <span className={styles.dept}>{profile.department}</span>

            <div className={styles.divider} />

            <div className={styles.fieldList}>
              <ProfileField
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M2 8l10 7 10-7" />
                  </svg>
                }
                label="Email"
                value={profile.email}
              />
              <ProfileField
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.2c1.1.4 2.3.6 3.6.6a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C9.6 21 3 14.4 3 6.4a1 1 0 0 1 1-1H7a1 1 0 0 1 1 1c0 1.3.2 2.5.6 3.6a1 1 0 0 1-.2 1L6.6 10.8z" />
                  </svg>
                }
                label="Phone"
                value={profile.phone}
              />
              <ProfileField
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M3 9h18M8 3v4M16 3v4" />
                  </svg>
                }
                label="Joined"
                value={`${formatDate(profile.joinDate)} · ${tenure}`}
              />
              <ProfileField
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                    <path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z" />
                  </svg>
                }
                label="Employee ID"
                value={profile.id}
              />
            </div>
          </div>

          {/* Right: task summary */}
          <div className={styles.rightCol}>
            <div className={styles.sectionCard}>
              <h3 className={styles.sectionTitle}>Task summary</h3>
              <div className={styles.statGrid}>
                <StatTile label="Total assigned" value={stats.totalAssigned} variant="neutral" />
                <StatTile label="Completed" value={stats.completed} variant="completed" />
                <StatTile label="Approved" value={stats.approved} variant="approved" />
                <StatTile label="Pending" value={stats.pending} variant="pending" />
                <StatTile label="Changes requested" value={stats.changesRequested} variant="changes" />
                <StatTile label="Not delivered" value={stats.notDelivered} variant="notDelivered" />
              </div>
            </div>

            <div className={styles.sectionCard}>
              <h3 className={styles.sectionTitle}>Performance</h3>
              <div className={styles.performanceRow}>
                <div className={styles.perfItem}>
                  <p className={styles.perfLabel}>Completion rate</p>
                  <p className={styles.perfValue}>
                    {stats.totalAssigned > 0
                      ? `${Math.round(((stats.completed + stats.approved) / stats.totalAssigned) * 100)}%`
                      : '—'}
                  </p>
                </div>
                <div className={styles.perfDivider} />
                <div className={styles.perfItem}>
                  <p className={styles.perfLabel}>Delivery rate</p>
                  <p className={styles.perfValue}>
                    {stats.totalAssigned > 0
                      ? `${Math.round(((stats.totalAssigned - stats.notDelivered) / stats.totalAssigned) * 100)}%`
                      : '—'}
                  </p>
                </div>
                <div className={styles.perfDivider} />
                <div className={styles.perfItem}>
                  <p className={styles.perfLabel}>Change-back rate</p>
                  <p className={styles.perfValue}>
                    {stats.totalAssigned > 0
                      ? `${Math.round((stats.changesRequested / stats.totalAssigned) * 100)}%`
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ProfileField: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className={styles.field}>
    <span className={styles.fieldIcon}>{icon}</span>
    <div>
      <p className={styles.fieldLabel}>{label}</p>
      <p className={styles.fieldValue}>{value}</p>
    </div>
  </div>
);

const STAT_COLORS: Record<string, string> = {
  neutral: '#1a1a18',
  completed: '#1a1a18',
  approved: '#27500a',
  pending: '#185fa5',
  changes: '#a32d2d',
  notDelivered: '#854f0b',
};

const StatTile: React.FC<{ label: string; value: number; variant: string }> = ({ label, value, variant }) => (
  <div className={styles.statTile}>
    <p className={styles.statValue} style={{ color: STAT_COLORS[variant] }}>{value}</p>
    <p className={styles.statLabel}>{label}</p>
  </div>
);

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}