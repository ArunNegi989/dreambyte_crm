"use client";

import { useState, useEffect } from "react";
import { Employee } from "@/types/superadmin/superAdmin";
import styles from "@/public/assets/styles/dashboard/super-admin-dashboard/Saassignrolemodal.module.css";

interface SAAssignRoleModalProps {
  employee: Employee;
  onClose: () => void;
  onAssign: (id: string, role: Employee["role"]) => void;
}

const roleOptions: { value: Employee["role"]; label: string; desc: string; color: string }[] = [
  {
    value: "employee",
    label: "Employee",
    desc: "Can view and complete assigned tasks only.",
    color: "green",
  },
  {
    value: "admin",
    label: "Admin",
    desc: "Can assign tasks, review submissions, manage team.",
    color: "blue",
  },
  {
    value: "super_admin",
    label: "Super Admin",
    desc: "Full platform access — brands, employees, all tasks.",
    color: "purple",
  },
];

export default function SAAssignRoleModal({
  employee,
  onClose,
  onAssign,
}: SAAssignRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<Employee["role"]>(employee.role);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = () => {
    onAssign(employee.id, selectedRole);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M16 14a6 6 0 0 1-8 0" />
              <line x1="18" y1="14" x2="18" y2="20" />
              <line x1="15" y1="17" x2="21" y2="17" />
            </svg>
          </div>
          <div>
            <h2 className={styles.title}>Assign Role</h2>
            <p className={styles.subtitle}>
              Changing role for <strong>{employee.name}</strong>
            </p>
          </div>
        </div>

        {/* Current Role Banner */}
        <div className={styles.currentBanner}>
          <span className={styles.currentLabel}>Current Role:</span>
          <span className={`${styles.currentRole} ${styles[`role_${employee.role}`]}`}>
            {employee.role === "super_admin"
              ? "Super Admin"
              : employee.role === "admin"
              ? "Admin"
              : "Employee"}
          </span>
        </div>

        {/* Role Options */}
        <div className={styles.roleList}>
          <p className={styles.selectLabel}>Select New Role</p>
          {roleOptions.map((opt) => (
            <button
              key={opt.value}
              className={`${styles.roleOption} ${selectedRole === opt.value ? styles.roleSelected : ""} ${styles[`roleColor_${opt.color}`]}`}
              onClick={() => setSelectedRole(opt.value)}
            >
              <div className={styles.roleOptionLeft}>
                <div className={`${styles.roleRadio} ${selectedRole === opt.value ? styles.radioChecked : ""}`}>
                  {selectedRole === opt.value && <div className={styles.radioDot} />}
                </div>
                <div>
                  <div className={styles.roleOptionLabel}>{opt.label}</div>
                  <div className={styles.roleOptionDesc}>{opt.desc}</div>
                </div>
              </div>
              {employee.role === opt.value && (
                <span className={styles.currentTag}>Current</span>
              )}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={selectedRole === employee.role}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Assign Role
          </button>
        </div>
      </div>
    </div>
  );
}