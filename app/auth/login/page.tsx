"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../../api/authApi';
import { apiFetch } from '../../api/apiClient';
import styles from '../../../assets/styles/loginpage/LoginPage.module.css';

const DEPARTMENT_DASHBOARDS: Record<string, string> = {
  'graphic':        '/dashboard/designerdashboard',
  'smm':            '/dashboard/smmdashboard',
  'photography':    '/dashboard/photographydashboard',
  'meta ads':       '/dashboard/metadashboard',
  'seo':            '/dashboard/seodashboard',
  'development':    '/dashboard/developerdashboard',
  'content writer': '/dashboard/contentwriterdashboard',
};

const ROLE_DASHBOARDS: Record<string, string> = {
  super_admin: '/dashboard/superadmindashboard',
  admin:       '/dashboard/admindashboard',
  employee:    '/dashboard/employeedashboard',
};

function getHomeRoute(role: string, department?: string | null): string {
  const key = (department || '').trim().toLowerCase();
  if (role === 'employee' && DEPARTMENT_DASHBOARDS[key]) {
    return DEPARTMENT_DASHBOARDS[key];
  }
  return ROLE_DASHBOARDS[role] ?? '/dashboard/employeedashboard';
}

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ employeeId: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegisterBtn, setShowRegisterBtn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const home = localStorage.getItem('userHomeRoute');
    if (token && home) {
      router.replace(home);
      return;
    }

    apiFetch<{ exists: boolean }>('/superadmin/auth/check-exists')
      .then((data) => setShowRegisterBtn(!data.exists))
      .catch(() => setShowRegisterBtn(false));
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId.trim() || !formData.password.trim()) {
      setError('Enter your employee ID and password to continue.');
      return;
    }
    setIsSubmitting(true);
    try {
      const data = await login(formData);
      // login() already persists session (incl. userDepartment) via storeSession()

      const fallback = getHomeRoute(data.user.role, data.user.department);
      router.replace(data.redirectTo || fallback);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Left: brand panel */}
      <div className={styles.brandPanel}>
        <div className={styles.brandTop}>
          <img src="/dbslogo.jpeg" alt="Company logo" className={styles.brandMark} />
          <span className={styles.brandEyebrow}>CRM · Employee Access</span>
        </div>

        <div className={styles.brandMid}>
          <h1 className={styles.brandHeading}>Every client, every campaign, one login.</h1>
          <p className={styles.brandSubtext}>
            Your CRM for client accounts and campaign work across design, social,
            ads, SEO, development, and content.
          </p>

          <div className={styles.brandReel}>
            {/* Replace src with your own looping GIF asset, e.g. /assets/studio-reel.gif */}
            <img
              src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeTB3c3MzZTF1M2gweWF0bG9raW51MXdsZ3ZpeTdqeHF5c2dteXJyYSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/zoKdmndB8QBR2c0gjy/giphy.gif"
              alt="Looping preview of the agency's work across departments"
              className={styles.brandReelMedia}
            />
           
          </div>
        </div>

      
      </div>

      {/* Right: sign-in form */}
      <div className={styles.formPanel}>
        <div className={styles.card}>
          <h2 className={styles.title}>Welcome back</h2>
          <p className={styles.subtitle}>Sign in with your employee credentials</p>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label htmlFor="employeeId" className={styles.label}>Employee ID</label>
              <input
                id="employeeId" name="employeeId" type="text" autoComplete="username"
                className={styles.input} placeholder="EMP10234"
                value={formData.employeeId} onChange={handleChange} disabled={isSubmitting}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <div className={styles.passwordWrap}>
                <input
                  id="password" name="password"
                  type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                  className={styles.input} placeholder="Enter your password"
                  value={formData.password} onChange={handleChange} disabled={isSubmitting}
                />
                <button type="button" className={styles.toggleVisibility}
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && <p className={styles.error} role="alert">{error}</p>}

            <div className={styles.optionsRow}>
              {/* <label className={styles.checkboxLabel}>
                <input type="checkbox" className={styles.checkbox} /> Remember me
              </label>
              <a href="#" className={styles.link}>Forgot password?</a> */}
            </div>

            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>

            {showRegisterBtn && (
              <>
                <div className={styles.divider}><span>or</span></div>
                <a href="/auth/superadmin-register" className={styles.registerButton}>
                  Register as superadmin
                </a>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}