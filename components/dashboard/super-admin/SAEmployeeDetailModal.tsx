"use client";

import { useEffect } from "react";
import { Employee, Task, Brand } from "@/types/superadmin/superAdmin";
import styles from "@/public/assets/styles/dashboard/super-admin-dashboard/Saemployeedetailmodal.module.css";

interface SAEmployeeDetailModalProps {
  employee: Employee;
  tasks: Task[];
  brands: Brand[];
  onClose: () => void;
}

export default function SAEmployeeDetailModal({
  employee,
  tasks,
  brands,
  onClose,
}: SAEmployeeDetailModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const empTasks = tasks.filter((t) => t.assignedTo === employee.id);
  const getBrandName = (id?: string) =>
    brands.find((b) => b.id === id)?.name ?? "—";

  const stats = [
    { label: "Total Tasks", val: empTasks.length, color: "#6366f1", bg: "#f5f3ff" },
    { label: "Completed", val: empTasks.filter((t) => t.status === "completed").length, color: "#10b981", bg: "#f0fdf4" },
    { label: "Pending", val: empTasks.filter((t) => t.status === "pending").length, color: "#f59e0b", bg: "#fffbeb" },
    { label: "Rejected", val: empTasks.filter((t) => t.status === "rejected").length, color: "#ef4444", bg: "#fef2f2" },
  ];

  const infoRows = [
    { label: "Employee ID", val: employee.employeeId },
    { label: "Email", val: employee.email },
    { label: "Phone", val: employee.phone || "—" },
    { label: "Date of Birth", val: employee.dob },
    { label: "Department", val: employee.department },
    { label: "Joined On", val: employee.joinDate },
  ];

  const statusStyles: Record<string, string> = {
    completed: styles.sCompleted,
    pending: styles.sPending,
    rejected: styles.sRejected,
    approved: styles.sApproved,
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

        {/* Profile Header */}
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>{employee.name[0]}</div>
          <div className={styles.profileInfo}>
            <h2 className={styles.name}>{employee.name}</h2>
            <p className={styles.roleText}>
              <span className={`${styles.rolePill} ${styles[`role_${employee.role}`]}`}>
                {employee.role === "super_admin" ? "Super Admin" : employee.role === "admin" ? "Admin" : "Employee"}
              </span>
              <span className={styles.dot}>·</span>
              {employee.department}
            </p>
            <span className={`${styles.statusBadge} ${employee.isActive ? styles.active : styles.inactive}`}>
              <span className={styles.statusDot} />
              {employee.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          {stats.map((s) => (
            <div key={s.label} className={styles.statBox} style={{ background: s.bg }}>
              <span className={styles.statNum} style={{ color: s.color }}>{s.val}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Info Grid */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Personal Information</h3>
          <div className={styles.infoGrid}>
            {infoRows.map((row) => (
              <div key={row.label} className={styles.infoItem}>
                <span className={styles.infoLabel}>{row.label}</span>
                <span className={styles.infoVal}>{row.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Task List */}
        <div className={styles.section}>
          <div className={styles.taskSectionHeader}>
            <h3 className={styles.sectionTitle}>Assigned Tasks</h3>
            <span className={styles.taskCount}>{empTasks.length} tasks</span>
          </div>

          {empTasks.length === 0 ? (
            <div className={styles.emptyTasks}>
              <span>📋</span>
              <p>No tasks assigned yet.</p>
            </div>
          ) : (
            <div className={styles.taskList}>
              {empTasks.map((task) => (
                <div key={task.id} className={styles.taskItem}>
                  <div className={styles.taskLeft}>
                    <div className={styles.taskTitle}>{task.title}</div>
                    <div className={styles.taskMeta}>
                      <span className={styles.taskBrand}>{getBrandName(task.brandId)}</span>
                      <span className={styles.taskDue}>Due: {task.dueDate}</span>
                      <span className={`${styles.taskFreq} ${styles[`freq_${task.frequency}`]}`}>
                        {task.frequency}
                      </span>
                    </div>
                    {task.rejectRemark && task.status === "rejected" && (
                      <div className={styles.rejectNote}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {task.rejectRemark}
                      </div>
                    )}
                  </div>
                  <div className={styles.taskRight}>
                    <span className={`${styles.statusPill} ${statusStyles[task.status]}`}>
                      {task.status}
                    </span>
                    <span className={`${styles.delivPill} ${task.deliveryStatus === "delivered" ? styles.delivered : styles.notDelivered}`}>
                      {task.deliveryStatus === "delivered" ? "✓" : "✗"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}