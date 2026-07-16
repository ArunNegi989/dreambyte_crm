"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../../assets/styles/loginpage/Registerpage.module.css';
import { superAdminRegister } from '../../api/superAdminApi';

interface RegisterFormState {
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  department: string;
  password: string;
  confirmPassword: string;
  joinDate: string;
}

const SuperAdminRegisterPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormState>({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    dob: '',
    department: '',
    password: '',
    confirmPassword: '',
    joinDate: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { employeeId, name, email, dob, department, password, confirmPassword, joinDate } = formData;

    if (!employeeId.trim() || !name.trim() || !email.trim() || !dob || !department.trim() || !password || !joinDate) {
      setError('All fields except phone are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await superAdminRegister({
        employeeId: formData.employeeId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        dob: formData.dob,
        department: formData.department,
        password: formData.password,
        joinDate: formData.joinDate,
      });

      router.push('/auth/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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

        <h1 className={styles.title}>Create superadmin</h1>
        <p className={styles.subtitle}>Register a new superadmin account</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {/* Section 1 — Identity */}
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionIndex}>1</span>
              <span className={styles.sectionTitle}>Identity</span>
              <span className={styles.sectionLine} />
            </div>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="employeeId" className={styles.label}>Employee ID</label>
                <input id="employeeId" name="employeeId" type="text" className={styles.input}
                  placeholder="e.g. SA10001" value={formData.employeeId} onChange={handleChange} disabled={isSubmitting} />
              </div>

              <div className={styles.field}>
                <label htmlFor="name" className={styles.label}>Full name</label>
                <input id="name" name="name" type="text" autoComplete="name" className={styles.input}
                  placeholder="e.g. Riya Sharma" value={formData.name} onChange={handleChange} disabled={isSubmitting} />
              </div>

              <div className={styles.field}>
                <label htmlFor="dob" className={styles.label}>Date of birth</label>
                <input id="dob" name="dob" type="date" className={styles.input}
                  value={formData.dob} onChange={handleChange} disabled={isSubmitting} />
              </div>

              <div className={styles.field}>
                <label htmlFor="phone" className={styles.label}>
                  Phone <span className={styles.optionalTag}>(optional)</span>
                </label>
                <input id="phone" name="phone" type="tel" autoComplete="tel" className={styles.input}
                  placeholder="e.g. +91 98765 43210" value={formData.phone} onChange={handleChange} disabled={isSubmitting} />
              </div>
            </div>
          </div>

          {/* Section 2 — Role & Access */}
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionIndex}>2</span>
              <span className={styles.sectionTitle}>Role &amp; access</span>
              <span className={styles.sectionLine} />
            </div>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="email" className={styles.label}>Email</label>
                <input id="email" name="email" type="email" autoComplete="email" className={styles.input}
                  placeholder="e.g. riya@dreambyte.in" value={formData.email} onChange={handleChange} disabled={isSubmitting} />
              </div>

              <div className={styles.field}>
                <label htmlFor="department" className={styles.label}>Department</label>
                <input id="department" name="department" type="text" className={styles.input}
                  placeholder="e.g. Management" value={formData.department} onChange={handleChange} disabled={isSubmitting} />
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label htmlFor="joinDate" className={styles.label}>Join date</label>
                <input id="joinDate" name="joinDate" type="date" className={styles.input}
                  value={formData.joinDate} onChange={handleChange} disabled={isSubmitting} />
              </div>
            </div>
          </div>

          {/* Section 3 — Security */}
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionIndex}>3</span>
              <span className={styles.sectionTitle}>Security</span>
              <span className={styles.sectionLine} />
            </div>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="password" className={styles.label}>Password</label>
                <div className={styles.passwordWrap}>
                  <input id="password" name="password" type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password" className={styles.input} placeholder="Min. 6 characters"
                    value={formData.password} onChange={handleChange} disabled={isSubmitting} />
                  <button type="button" className={styles.toggleVisibility}
                    onClick={() => setShowPassword((p) => !p)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="confirmPassword" className={styles.label}>Confirm password</label>
                <div className={styles.passwordWrap}>
                  <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password" className={styles.input} placeholder="Re-enter your password"
                    value={formData.confirmPassword} onChange={handleChange} disabled={isSubmitting} />
                  <button type="button" className={styles.toggleVisibility}
                    onClick={() => setShowConfirmPassword((p) => !p)}>
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && <p className={styles.error} role="alert">{error}</p>}

          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create superadmin account'}
          </button>

          <p className={styles.footNote}>
            Already have an account?{' '}
            <a href="/auth/login" className={styles.link}>Sign in</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SuperAdminRegisterPage;