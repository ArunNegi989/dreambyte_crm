"use client";

import { useState } from "react";
import { Employee, Task, Brand, TaskStatus } from "@/types/superadmin/superAdmin";
import styles from "@/public/assets/styles/dashboard/super-admin-dashboard/Sastatscards.module.css";

interface SAStatsCardsProps {
  employees: Employee[];
  tasks: Task[];
  brands: Brand[];
}

type DetailPanel = "employees" | "tasks" | "completed" | "rejected" | "pending" | "brands" | null;

export default function SAStatsCards({ employees, tasks, brands }: SAStatsCardsProps) {
  const [activePanel, setActivePanel] = useState<DetailPanel>(null);

  const stats = {
    totalEmployees: employees.length,
    totalTasksAllotted: tasks.length,
    totalTasksCompleted: tasks.filter((t) => t.status === "completed").length,
    totalTasksRejected: tasks.filter((t) => t.status === "rejected").length,
    totalTasksPending: tasks.filter((t) => t.status === "pending").length,
    totalBrands: brands.length,
  };

  // Handles both populated object and plain string id
  const getEmpName = (assignedTo: string | { _id: string; name: string }) => {
    if (typeof assignedTo === "object") return assignedTo.name;
    return employees.find((e) => e._id === assignedTo)?.name ?? "—";
  };

  const getBrandName = (brandId?: string | { _id: string; name: string } | null) => {
    if (!brandId) return "—";
    if (typeof brandId === "object") return brandId.name;
    return brands.find((b) => b._id === brandId)?.name ?? "—";
  };

  const cards = [
    { key: "employees" as DetailPanel, label: "All Employees", value: stats.totalEmployees, color: "indigo", icon: "👥" },
    { key: "tasks" as DetailPanel, label: "Tasks Allotted", value: stats.totalTasksAllotted, color: "blue", icon: "📋" },
    { key: "completed" as DetailPanel, label: "Tasks Completed", value: stats.totalTasksCompleted, color: "green", icon: "✅" },
    { key: "rejected" as DetailPanel, label: "Tasks Rejected", value: stats.totalTasksRejected, color: "red", icon: "❌" },
    { key: "pending" as DetailPanel, label: "Tasks Pending", value: stats.totalTasksPending, color: "amber", icon: "⏳" },
    { key: "brands" as DetailPanel, label: "Brands", value: stats.totalBrands, color: "purple", icon: "🏷️" },
  ];

  const handleCard = (key: DetailPanel) => {
    setActivePanel(activePanel === key ? null : key);
  };

  const filteredTasks = (status?: TaskStatus) =>
    status ? tasks.filter((t) => t.status === status) : tasks;

  return (
    <div className={styles.wrap}>
      {/* Cards Grid */}
      <div className={styles.grid}>
        {cards.map((c) => (
          <button
            key={c.key}
            className={`${styles.card} ${styles[c.color]} ${activePanel === c.key ? styles.cardActive : ""}`}
            onClick={() => handleCard(c.key)}
          >
            <div className={styles.cardTop}>
              <span className={styles.cardEmoji}>{c.icon}</span>
              <span className={styles.cardArrow}>{activePanel === c.key ? "▲" : "▼"}</span>
            </div>
            <div className={styles.cardValue}>{c.value}</div>
            <div className={styles.cardLabel}>{c.label}</div>
          </button>
        ))}
      </div>

      {/* Detail Panels */}
      {activePanel && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>
              {cards.find((c) => c.key === activePanel)?.label} — Details
            </h3>
            <button className={styles.closePanel} onClick={() => setActivePanel(null)}>✕</button>
          </div>

          {/* All Employees */}
          {activePanel === "employees" && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Emp ID</th><th>Name</th><th>Department</th>
                    <th>Role</th><th>Tasks</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => {
                    const empTasks = tasks.filter((t) => {
                      const id = typeof t.assignedTo === "object"
                        ? (t.assignedTo as { _id: string })._id
                        : t.assignedTo;
                      return id === emp._id;
                    });
                    return (
                      <tr key={emp._id}>
                        <td><span className={styles.empIdPill}>{emp.employeeId}</span></td>
                        <td>
                          <div className={styles.empCell}>
                            <div className={styles.miniAvatar}>{emp.name[0]}</div>
                            <div>
                              <div className={styles.empName}>{emp.name}</div>
                              <div className={styles.empEmail}>{emp.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>{emp.department}</td>
                        <td>
                          <span className={`${styles.rolePill} ${styles[`role_${emp.role}`]}`}>
                            {emp.role}
                          </span>
                        </td>
                        <td>{empTasks.length} tasks</td>
                        <td>
                          <span className={`${styles.statusPill} ${emp.isActive ? styles.active : styles.inactive}`}>
                            {emp.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* All Tasks */}
          {activePanel === "tasks" && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Task</th><th>Assigned To</th><th>Brand</th>
                    <th>By</th><th>Due</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks().map((t) => (
                    <tr key={t._id}>
                      <td><span className={styles.taskName}>{t.title}</span></td>
                      <td>{getEmpName(t.assignedTo)}</td>
                      <td>{getBrandName(t.brandId ?? undefined)}</td>
                      <td>
                        <span className={`${styles.byPill} ${t.assignedBy === "super_admin" ? styles.bySA : styles.byAdmin}`}>
                          {t.assignedBy === "super_admin" ? "Super Admin" : "Admin"}
                        </span>
                      </td>
                      <td>{t.dueDate || "—"}</td>
                      <td>
                        <span className={`${styles.sPill} ${styles[`s_${t.status}`]}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Completed Tasks */}
          {activePanel === "completed" && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Task</th><th>Assigned To</th><th>Brand</th><th>Due Date</th></tr>
                </thead>
                <tbody>
                  {filteredTasks("completed").map((t) => (
                    <tr key={t._id}>
                      <td><span className={styles.taskName}>{t.title}</span></td>
                      <td>{getEmpName(t.assignedTo)}</td>
                      <td>{getBrandName(t.brandId ?? undefined)}</td>
                      <td>{t.dueDate || "—"}</td>
                    </tr>
                  ))}
                  {filteredTasks("completed").length === 0 && (
                    <tr><td colSpan={4} className={styles.empty}>No completed tasks yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Rejected Tasks */}
          {activePanel === "rejected" && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Task</th><th>Employee</th><th>Brand</th><th>Reject Remark</th></tr>
                </thead>
                <tbody>
                  {filteredTasks("rejected").map((t) => (
                    <tr key={t._id}>
                      <td><span className={styles.taskName}>{t.title}</span></td>
                      <td>{getEmpName(t.assignedTo)}</td>
                      <td>{getBrandName(t.brandId ?? undefined)}</td>
                      <td><span className={styles.remark}>{t.rejectRemark || "No remark provided."}</span></td>
                    </tr>
                  ))}
                  {filteredTasks("rejected").length === 0 && (
                    <tr><td colSpan={4} className={styles.empty}>No rejected tasks.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pending Tasks */}
          {activePanel === "pending" && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Task</th><th>Employee</th><th>Brand</th>
                    <th>Due Date</th><th>Delivery</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks("pending").map((t) => (
                    <tr key={t._id}>
                      <td><span className={styles.taskName}>{t.title}</span></td>
                      <td>{getEmpName(t.assignedTo)}</td>
                      <td>{getBrandName(t.brandId ?? undefined)}</td>
                      <td>{t.dueDate || "—"}</td>
                      <td>
                        <span className={`${styles.delivPill} ${t.deliveryStatus === "delivered" ? styles.delivered : styles.notDelivered}`}>
                          {t.deliveryStatus === "delivered" ? "✓ Delivered" : "✗ Not Delivered"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredTasks("pending").length === 0 && (
                    <tr><td colSpan={5} className={styles.empty}>No pending tasks.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Brands */}
          {activePanel === "brands" && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Brand</th><th>Industry</th><th>Status</th><th>Tasks</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map((b) => (
                    <tr key={b._id}>
                      <td><span className={styles.brandName}>{b.name}</span></td>
                      <td>{b.industry}</td>
                      <td>
                        <span className={`${styles.statusPill} ${b.status === "active" ? styles.active : styles.inactive}`}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        {tasks.filter((t) => {
                          const bid = typeof t.brandId === "object" && t.brandId
                            ? (t.brandId as { _id: string })._id
                            : t.brandId;
                          return bid === b._id;
                        }).length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}