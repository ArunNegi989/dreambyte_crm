"use client";

import { useEffect } from "react";
import { EmployeeWithStats } from "@/types/admin/Crm";
import styles from "@/public/assets/styles/dashboard/admindashboard/Employeemodal.module.css";

interface EmployeeModalProps {
  employee: EmployeeWithStats | null;
  onClose: () => void;
}

export default function EmployeeModal({ employee, onClose }: EmployeeModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!employee) return null;

  const statusColor: Record<string, string> = {
    approved: styles.approved,
    pending: styles.pending,
    rejected: styles.rejected,
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Employee Header */}
        <div className={styles.header}>
          <div className={styles.avatar}>{employee.name.charAt(0)}</div>
          <div className={styles.headerInfo}>
            <h2 className={styles.name}>{employee.name}</h2>
            <p className={styles.role}>{employee.role} · {employee.department}</p>
            <p className={styles.contact}>{employee.email} | {employee.phone}</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className={styles.statsRow}>
          <div className={styles.statBox}>
            <span className={styles.statNum}>{employee.totalTasks}</span>
            <span className={styles.statLabel}>Total Tasks</span>
          </div>
          <div className={`${styles.statBox} ${styles.greenStat}`}>
            <span className={styles.statNum}>{employee.approvedTasks}</span>
            <span className={styles.statLabel}>Approved</span>
          </div>
          <div className={`${styles.statBox} ${styles.yellowStat}`}>
            <span className={styles.statNum}>{employee.pendingTasks}</span>
            <span className={styles.statLabel}>Pending</span>
          </div>
          <div className={`${styles.statBox} ${styles.redStat}`}>
            <span className={styles.statNum}>{employee.rejectedTasks}</span>
            <span className={styles.statLabel}>Rejected</span>
          </div>
        </div>

        {/* Task List */}
        <div className={styles.taskSection}>
          <h3 className={styles.sectionTitle}>Assigned Tasks</h3>
          {employee.tasks.length === 0 ? (
            <p className={styles.empty}>No tasks assigned yet.</p>
          ) : (
            <div className={styles.taskList}>
              {employee.tasks.map((task) => (
                <div key={task.id} className={styles.taskRow}>
                  <div className={styles.taskInfo}>
                    <span className={styles.taskName}>{task.title}</span>
                    <div className={styles.taskMeta}>
                      <span className={styles.freq}>{task.frequency}</span>
                      <span className={styles.due}>Due: {task.dueDate}</span>
                    </div>
                  </div>
                  <div className={styles.taskBadges}>
                    <span className={`${styles.badge} ${statusColor[task.status]}`}>
                      {task.status}
                    </span>
                    <span className={`${styles.deliveryBadge} ${task.deliveryStatus === "delivered" ? styles.delivered : styles.notDelivered}`}>
                      {task.deliveryStatus === "delivered" ? "✓ Delivered" : "✗ Not Delivered"}
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