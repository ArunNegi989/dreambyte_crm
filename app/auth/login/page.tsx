"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../../api/authApi';
import styles from '../../../assets/styles/loginpage/LoginPage.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ employeeId: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      
      // Store user data in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', data.user.role);
      localStorage.setItem('userName', data.user.name);
      localStorage.setItem('userEmployeeId', data.user.employeeId);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Role-based redirect (frontend handles it)
      const role = data.user.role;
      if (role === 'super_admin') {
        router.push('/dashboard/superadmindashboard');
      } else if (role === 'admin') {
        router.push('/dashboard/admindashboard');
      } else {
        router.push('/dashboard/employeedashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <img src="/dbslogo.jpeg" alt="Company logo" className={styles.logo} />
        </div>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in with your employee credentials</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="employeeId" className={styles.label}>Employee ID</label>
            <input
              id="employeeId" name="employeeId" type="text" autoComplete="username"
              className={styles.input} placeholder="e.g. EMP10234"
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
            <label className={styles.checkboxLabel}>
              <input type="checkbox" className={styles.checkbox} /> Remember me
            </label>
            <a href="#" className={styles.link}>Forgot password?</a>
          </div>

          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>

          <div className={styles.divider}><span>or</span></div>

          <a href="/auth/superadmin-register" className={styles.registerButton}>
            Register as superadmin
          </a>
        </form>
      </div>
    </div>
  );
}