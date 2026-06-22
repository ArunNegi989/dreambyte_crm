"use client";

import { useState, useEffect } from "react";
import { Employee } from "@/types/superadmin/superAdmin";
import styles from "@/public/assets/styles/dashboard/super-admin-dashboard/Sacreateemployeemodal.module.css";

interface SACreateEmployeeModalProps {
  onClose: () => void;
  onCreated: (emp: Omit<Employee, "id">) => { employeeId: string; password: string };
}

const generateEmployeeId = (dob: string): string => {
  if (!dob) return "";
  const year = new Date(dob).getFullYear();
  return `DBS-2021-${year}`;
};

export default function SACreateEmployeeModal({ onClose, onCreated }: SACreateEmployeeModalProps) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", dob: "",
    department: "", password: "", role: "employee" as Employee["role"],
  });
  const [step, setStep] = useState<"form" | "success">("form");
  const [createdCreds, setCreatedCreds] = useState({ employeeId: "", password: "" });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const empIdPreview = generateEmployeeId(form.dob);

  const handleCreate = () => {
    if (!form.name || !form.email || !form.dob || !form.department || !form.password) return;
    const result = onCreated({
      employeeId: empIdPreview,
      name: form.name,
      email: form.email,
      phone: form.phone,
      dob: form.dob,
      department: form.department,
      role: form.role,
      password: form.password,
      joinDate: new Date().toISOString().split("T")[0],
      isActive: true,
    });
    setCreatedCreds(result);
    setStep("success");
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {step === "form" ? (
          <>
            <div className={styles.modalHeader}>
              <div className={styles.modalIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h2 className={styles.modalTitle}>Create Employee</h2>
                <p className={styles.modalSub}>Fill in all details to onboard a new employee</p>
              </div>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>Full Name *</label>
                <input className={styles.input} placeholder="Rahul Sharma" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label>Email *</label>
                <input className={styles.input} type="email" placeholder="rahul@dreambyte.in" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label>Phone</label>
                <input className={styles.input} placeholder="+91 98765 00000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label>Date of Birth *</label>
                <input className={styles.input} type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label>Department *</label>
                <select className={styles.input} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                  <option value="">Select Department</option>
                  <option>Development</option>
                  <option>Design</option>
                  <option>Backend</option>
                  <option>QA</option>
                  <option>Marketing</option>
                  <option>HR</option>
                  <option>Sales</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Role</label>
                <select className={styles.input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Employee["role"] })}>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className={`${styles.field} ${styles.fullSpan}`}>
                <label>Password *</label>
                <input className={styles.input} type="text" placeholder="Set a secure password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
            </div>

            {/* Preview ID */}
            {empIdPreview && (
              <div className={styles.previewBox}>
                <span className={styles.previewLabel}>Auto-generated Employee ID:</span>
                <span className={styles.previewId}>{empIdPreview}</span>
              </div>
            )}

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
              <button className={styles.createBtn} onClick={handleCreate}>
                Create Employee
              </button>
            </div>
          </>
        ) : (
          /* Success Step */
          <div className={styles.successStep}>
            <div className={styles.successIcon}>🎉</div>
            <h2 className={styles.successTitle}>Employee Created!</h2>
            <p className={styles.successSub}>Share these credentials with the employee for login.</p>

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
              Employee will use <strong>Employee ID</strong> + <strong>Password</strong> to login.
            </p>

            <button className={styles.doneBtn} onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}