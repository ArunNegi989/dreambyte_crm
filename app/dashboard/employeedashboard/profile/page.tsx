"use client"

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, logout } from '../../../api/authApi';
import { getDashboardStats } from '../../../api/employeeApi';
import Sidebar from '../../../../components/dashboard/employeedashboard/Sidebar';
import styles from '../../../../assets/styles/employeedashboard/Profile.module.css';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'employee';
    Promise.all([getProfile(role), getDashboardStats()])
      .then(([prof, st]) => {
        setProfile(prof);
        setStats(st);
      })
      .catch(() => router.push('/auth/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    const role = localStorage.getItem('userRole') || 'employee';
    try { await logout(role); } finally {
      localStorage.clear();
      router.push('/auth/login');
    }
  };

  const tenure = useMemo(() => {
    if (!profile?.joinDate) return '';
    const join = new Date(profile.joinDate);
    const now = new Date();
    const months = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
    if (months >= 12) {
      const yrs = Math.floor(months / 12);
      const rem = months % 12;
      return `${yrs} yr${yrs > 1 ? 's' : ''}${rem ? ` ${rem}m` : ''}`;
    }
    return `${months}m`;
  }, [profile]);

  const initials = useMemo(() => {
    if (!profile?.name) return '?';
    return profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  }, [profile]);

  if (loading) {
    return (
      <div className={styles.shell}>
        <Sidebar />
        <div className={styles.page}>
          <p style={{ color: '#8a8a84', padding: '32px' }}>Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const overall = stats?.overall ?? {};

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.page}>
        <div className={styles.topBarRow}>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="16" height="16">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Logout
          </button>
        </div>

        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Profile</h1>
          <p className={styles.pageSubtitle}>Your account details and task summary</p>
        </header>

        <div className={styles.layout}>
          <div className={styles.identityCard}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatar}>{initials}</div>
            </div>
            <h2 className={styles.name}>{profile.name}</h2>
            <p className={styles.role}>{profile.role?.replace('_', ' ')}</p>
            <span className={styles.dept}>{profile.department}</span>

            <div className={styles.divider} />

            <div className={styles.fieldList}>
              <ProfileField
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 8l10 7 10-7" /></svg>}
                label="Email" value={profile.email} />
              <ProfileField
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.2c1.1.4 2.3.6 3.6.6a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C9.6 21 3 14.4 3 6.4a1 1 0 0 1 1-1H7a1 1 0 0 1 1 1c0 1.3.2 2.5.6 3.6a1 1 0 0 1-.2 1L6.6 10.8z" /></svg>}
                label="Phone" value={profile.phone || '—'} />
              <ProfileField
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></svg>}
                label="Joined" value={profile.joinDate ? `${formatDate(profile.joinDate)} · ${tenure}` : '—'} />
              <ProfileField
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /><path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z" /></svg>}
                label="Employee ID" value={profile.employeeId} />
            </div>
          </div>

          <div className={styles.rightCol}>
            <div className={styles.sectionCard}>
              <h3 className={styles.sectionTitle}>Task summary</h3>
              <div className={styles.statGrid}>
                <StatTile label="Total assigned" value={overall.totalAssigned ?? 0} variant="neutral" />
                <StatTile label="Completed" value={overall.completed ?? 0} variant="completed" />
                <StatTile label="Approved" value={overall.approved ?? 0} variant="approved" />
                <StatTile label="Pending" value={overall.pending ?? 0} variant="pending" />
                <StatTile label="Changes requested" value={overall.changesRequested ?? 0} variant="changes" />
                <StatTile label="Not delivered" value={overall.notDelivered ?? 0} variant="notDelivered" />
              </div>
            </div>

            <div className={styles.sectionCard}>
              <h3 className={styles.sectionTitle}>Performance</h3>
              <div className={styles.performanceRow}>
                <div className={styles.perfItem}>
                  <p className={styles.perfLabel}>Completion rate</p>
                  <p className={styles.perfValue}>
                    {overall.totalAssigned > 0
                      ? `${Math.round(((overall.completed + overall.approved) / overall.totalAssigned) * 100)}%`
                      : '—'}
                  </p>
                </div>
                <div className={styles.perfDivider} />
                <div className={styles.perfItem}>
                  <p className={styles.perfLabel}>Delivery rate</p>
                  <p className={styles.perfValue}>
                    {overall.totalAssigned > 0
                      ? `${Math.round(((overall.totalAssigned - overall.notDelivered) / overall.totalAssigned) * 100)}%`
                      : '—'}
                  </p>
                </div>
                <div className={styles.perfDivider} />
                <div className={styles.perfItem}>
                  <p className={styles.perfLabel}>Change-back rate</p>
                  <p className={styles.perfValue}>
                    {overall.totalAssigned > 0
                      ? `${Math.round((overall.changesRequested / overall.totalAssigned) * 100)}%`
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
  neutral: '#1a1a18', completed: '#1a1a18', approved: '#27500a',
  pending: '#185fa5', changes: '#a32d2d', notDelivered: '#854f0b',
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