"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Employee } from "@/types/superadmin/superAdmin";
import styles from "@/public/assets/styles/dashboard/super-admin-dashboard/Sacreateemployeemodal.module.css";

interface SACreateEmployeeModalProps {
  onClose: () => void;
  onCreated: (emp: Employee) => void;
}

// ── Regex validators ──────────────────────────────────────────
const PHONE_REGEX = /^[0-9]{10}$/;                     // exactly 10 digits
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;      // standard email

export default function SACreateEmployeeModal({
  onClose,
  onCreated,
}: SACreateEmployeeModalProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    department: "",
    password: "",
    role: "employee" as Employee["role"],
  });
  const [step, setStep] = useState<"form" | "success">("form");
  const [createdCreds, setCreatedCreds] = useState({
    employeeId: "",
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Live preview of auto-generated ID
  const idPreview = form.dob
    ? `DBS-2021-${new Date(form.dob).getFullYear()}-XXX`
    : "";

  // ── Per-field live validation ─────────────────────────────
  const validateField = (name: string, value: string) => {
    let error = "";
    if (name === "phone" && value) {
      if (!/^[0-9]*$/.test(value)) error = "Only digits allowed.";
      else if (value.length > 10) error = "Max 10 digits allowed.";
      else if (value.length > 0 && value.length < 10) error = "Phone must be exactly 10 digits.";
    }
    if (name === "email" && value) {
      if (!EMAIL_REGEX.test(value)) error = "Enter a valid email address.";
    }
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (name: string, value: string) => {
    // Phone: block non-digits and more than 10 chars at input level
    if (name === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    setForm((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  // ── Submit validation ─────────────────────────────────────
  const handleCreate = async () => {
    const errors: Record<string, string> = {};

    if (!form.name.trim()) errors.name = "Full name is required.";
    if (!form.email.trim()) {
      errors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(form.email)) {
      errors.email = "Enter a valid email address.";
    }
    if (form.phone && !PHONE_REGEX.test(form.phone)) {
      errors.phone = "Phone must be exactly 10 digits.";
    }
    if (!form.dob) errors.dob = "Date of Birth is required.";
    if (!form.department) errors.department = "Department is required.";
    if (!form.password) errors.password = "Password is required.";

    if (Object.values(errors).some(Boolean)) {
      setFieldErrors(errors);
      setFormError("Please fix the errors below.");
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      const res = await api.post("/employees", form);
      const { data, plainPassword } = res.data;

      onCreated(data);

      setCreatedCreds({
        employeeId: data.employeeId,
        password: plainPassword,
      });
      setStep("success");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        axiosErr?.response?.data?.message ??
        axiosErr?.message ??
        "Failed to create employee";
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* ── FORM STEP ── */}
        {step === "form" && (
          <>
            <div className={styles.modalHeader}>
              <div className={styles.modalIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h2 className={styles.modalTitle}>Create Employee</h2>
                <p className={styles.modalSub}>Fill in all details to onboard a new employee</p>
              </div>
            </div>

            {formError && <p className={styles.formError}>⚠️ {formError}</p>}

            <div className={styles.formGrid}>
              {/* Full Name */}
              <div className={styles.field}>
                <label>Full Name *</label>
                <input
                  className={`${styles.input} ${fieldErrors.name ? styles.inputError : ""}`}
                  placeholder="Rahul Sharma"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
                {fieldErrors.name && <span className={styles.fieldError}>{fieldErrors.name}</span>}
              </div>

              {/* Email */}
              <div className={styles.field}>
                <label>Email *</label>
                <input
                  className={`${styles.input} ${fieldErrors.email ? styles.inputError : ""}`}
                  type="email"
                  placeholder="rahul@dreambyte.in"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
                {fieldErrors.email && <span className={styles.fieldError}>{fieldErrors.email}</span>}
              </div>

              {/* Phone */}
              <div className={styles.field}>
                <label>Phone</label>
                <input
                  className={`${styles.input} ${fieldErrors.phone ? styles.inputError : ""}`}
                  placeholder="9876500000"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
                {fieldErrors.phone && <span className={styles.fieldError}>{fieldErrors.phone}</span>}
              </div>

              {/* DOB */}
              <div className={styles.field}>
                <label>Date of Birth *</label>
                <input
                  className={`${styles.input} ${fieldErrors.dob ? styles.inputError : ""}`}
                  type="date"
                  value={form.dob}
                  onChange={(e) => handleChange("dob", e.target.value)}
                />
                {fieldErrors.dob && <span className={styles.fieldError}>{fieldErrors.dob}</span>}
              </div>

              {/* Department */}
              <div className={styles.field}>
                <label>Department *</label>
                <select
                  className={`${styles.input} ${fieldErrors.department ? styles.inputError : ""}`}
                  value={form.department}
                  onChange={(e) => handleChange("department", e.target.value)}
                >
                  <option value="">Select Department</option>
                  <option>Development</option>
                  <option>Design</option>
                  <option>Backend</option>
                  <option>QA</option>
                  <option>Marketing</option>
                  <option>HR</option>
                  <option>Sales</option>
                </select>
                {fieldErrors.department && <span className={styles.fieldError}>{fieldErrors.department}</span>}
              </div>

              {/* Role */}
              <div className={styles.field}>
                <label>Role</label>
                <select
                  className={styles.input}
                  value={form.role}
                  onChange={(e) => handleChange("role", e.target.value)}
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Password with eye toggle */}
              <div className={`${styles.field} ${styles.fullSpan}`}>
                <label>Password *</label>
                <div className={styles.passwordWrapper}>
                  <input
                    className={`${styles.input} ${styles.passwordInput} ${fieldErrors.password ? styles.inputError : ""}`}
                    type={showPassword ? "text" : "password"}
                    placeholder="Set a secure password"
                    value={form.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      // Eye-off icon
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      // Eye icon
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {fieldErrors.password && <span className={styles.fieldError}>{fieldErrors.password}</span>}
              </div>
            </div>

            {/* ID Preview */}
            {idPreview && (
              <div className={styles.previewBox}>
                <span className={styles.previewLabel}>Auto-generated Employee ID (preview):</span>
                <span className={styles.previewId}>{idPreview}</span>
              </div>
            )}

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={onClose}>
                Cancel
              </button>
              <button
                className={styles.createBtn}
                onClick={handleCreate}
                disabled={saving}
              >
                {saving ? "Creating..." : "Create Employee"}
              </button>
            </div>
          </>
        )}

        {/* ── SUCCESS STEP ── */}
        {step === "success" && (
          <div className={styles.successStep}>
            <div className={styles.successIcon}>🎉</div>
            <h2 className={styles.successTitle}>Employee Created!</h2>
            <p className={styles.successSub}>
              Share these credentials with the employee for login.
            </p>

            <div className={styles.credsBox}>
              <div className={styles.credRow}>
                <span className={styles.credLabel}>Employee ID</span>
                <span className={styles.credValue}>{createdCreds.employeeId}</span>
              </div>
              <div className={styles.credDivider} />
              <div className={styles.credRow}>
                <span className={styles.credLabel}>Password</span>
                <span className={styles.credValue}>{createdCreds.password}</span>
              </div>
            </div>

            <p className={styles.loginNote}>
              Employee will use <strong>Employee ID</strong> +{" "}
              <strong>Password</strong> to login.
            </p>

            <button className={styles.doneBtn} onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}