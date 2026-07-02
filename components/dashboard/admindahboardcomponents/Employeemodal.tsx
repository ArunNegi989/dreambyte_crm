"use client";

import { useEffect } from "react";
import { EmployeeWithStats, Brand } from "@/types/admin/Crm";
import { getTimeTakenFromDates } from "@/data/employee/taskTimeHelpers"; // adjust path if needed
import styles from "@/public/assets/styles/dashboard/admindashboard/Employeemodal.module.css";

interface EmployeeModalProps {
  employee: EmployeeWithStats | null;
  brands?: Brand[];
  onClose: () => void;
}

export default function EmployeeModal({ employee, brands = [], onClose }: EmployeeModalProps) {
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
    completed: styles.approved,
  };

  // Compute stats straight from the task list (same approach as the
  // super-admin modal) so this doesn't depend on precomputed aggregate
  // fields that may or may not include a "completed" count.
  const totalTasks = employee.tasks.length;
  const completedTasks = employee.tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = employee.tasks.filter((t) => t.status === "pending").length;
  const rejectedTasks = employee.tasks.filter((t) => t.status === "rejected").length;

  const stats = [
    { label: "Total Tasks", val: totalTasks, color: "#6366f1", bg: "#f5f3ff" },
    { label: "Completed",   val: completedTasks, color: "#10b981", bg: "#f0fdf4" },
    { label: "Pending",     val: pendingTasks, color: "#f59e0b", bg: "#fffbeb" },
    { label: "Rejected",    val: rejectedTasks, color: "#ef4444", bg: "#fef2f2" },
  ];

  const infoRows = [
    { label: "Employee ID",   val: employee.employeeId ?? "—" },
    { label: "Email",         val: employee.email },
    { label: "Phone",         val: employee.phone || "—" },
    { label: "Date of Birth", val: employee.dob ?? "—" },
    { label: "Department",    val: employee.department },
    { label: "Joined On",     val: employee.joinDate ?? "—" },
  ];

  const getBrandName = (task: EmployeeWithStats["tasks"][0]) => {
    const brandId = (task as { brandId?: string | { _id: string; name: string } | null }).brandId;
    if (!brandId) return "—";
    if (typeof brandId === "object") return brandId.name;
    return brands.find((b) => b._id === brandId)?.name ?? "—";
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

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.avatar}>{employee.name.charAt(0)}</div>
          <div className={styles.headerInfo}>
            <h2 className={styles.name}>{employee.name}</h2>
            <p className={styles.role}>
              {employee.role} · {employee.department}
              {employee.isActive !== undefined && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 999,
                    color: employee.isActive ? "#10b981" : "#ef4444",
                    background: employee.isActive ? "#f0fdf4" : "#fef2f2",
                  }}
                >
                  {employee.isActive ? "● Active" : "● Inactive"}
                </span>
              )}
            </p>
            <p className={styles.contact}>{employee.email} | {employee.phone || "—"}</p>
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

        {/* Personal Information */}
        <div className={styles.taskSection}>
          <h3 className={styles.sectionTitle}>Personal Information</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              rowGap: 16,
              columnGap: 24,
            }}
          >
            {infoRows.map((row) => (
              <div key={row.label} style={{ minWidth: 0, paddingRight: 8 }}>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>{row.label}</div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                >
                  {row.val}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Task List */}
        <div className={styles.taskSection}>
          <h3 className={styles.sectionTitle}>Assigned Tasks</h3>
          {employee.tasks.length === 0 ? (
            <p className={styles.empty}>No tasks assigned yet.</p>
          ) : (
            <div className={styles.taskList}>
              {employee.tasks.map((task) => {
                const timeTaken = getTimeTakenFromDates(
                  (task as { startedAt?: string | null }).startedAt,
                  (task as { deliveredAt?: string | null }).deliveredAt
                );

                return (
                  <div key={task._id} className={styles.taskRow}>
                    <div className={styles.taskInfo}>
                      <span className={styles.taskName}>{task.title}</span>
                      <div className={styles.taskMeta}>
                        <span className={styles.freq}>{task.frequency}</span>
                        <span className={styles.due}>Due: {task.dueDate || "—"}</span>
                        <span style={{ fontSize: 12, color: "#64748b" }}>{getBrandName(task)}</span>
                        {timeTaken && (
                          <span style={{ fontSize: 12, color: "#64748b", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="9" />
                              <path d="M12 7v5l3 3" />
                            </svg>
                            {timeTaken}
                          </span>
                        )}
                      </div>
                      {/* Delivery note if present */}
                      {task.deliveryNote && (
                        <div className={styles.deliveryNote}>
                          📝 {task.deliveryNote}
                        </div>
                      )}
                      {/* Reject remark, mirrors the SA modal's inline warning */}
                      {(task as { rejectRemark?: string }).rejectRemark && task.status === "rejected" && (
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 12,
                            color: "#ef4444",
                            background: "#fef2f2",
                            borderRadius: 6,
                            padding: "4px 8px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          {(task as { rejectRemark?: string }).rejectRemark}
                        </div>
                      )}
                    </div>
                    <div className={styles.taskBadges}>
                      <span className={`${styles.badge} ${statusColor[task.status] ?? ""}`}>
                        {task.status}
                      </span>
                      <span className={`${styles.deliveryBadge} ${task.deliveryStatus === "delivered" ? styles.delivered : styles.notDelivered}`}>
                        {task.deliveryStatus === "delivered" ? "✓ Delivered" : "✗ Not Delivered"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}