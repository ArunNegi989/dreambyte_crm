"use client";

import { useState } from "react";
import SALayout, { SASection } from "@/components/dashboard/super-admin/SALayout";
import SAStatsCards from "@/components/dashboard/super-admin/SAStatsCards";
import SABrands from "@/components/dashboard/super-admin/SABrands";
import SAEmployees from "@/components/dashboard/super-admin/SAEmployees";
import SATasks from "@/components/dashboard/super-admin/SATasks";
import { Brand, Employee, Task, TaskStatus } from "@/types/superadmin/superAdmin";
import {
  brands as initBrands,
  employees as initEmployees,
  tasks as initTasks,
} from "@/lib/saMockData";
import styles from "@/app/dashboard/superadmindashboard/superadmindashboard.module.css";

export default function SuperAdminPage() {
  const [section, setSection] = useState<SASection>("dashboard");
  const [brands, setBrands] = useState<Brand[]>(initBrands);
  const [employees, setEmployees] = useState<Employee[]>(initEmployees);
  const [tasks, setTasks] = useState<Task[]>(initTasks);

  const sectionTitles: Record<SASection, { title: string; sub: string }> = {
    dashboard: { title: "Super Admin Dashboard", sub: "Full platform overview" },
    brands: { title: "Brands", sub: "Manage all client brands" },
    employees: { title: "Employees", sub: "Manage team members and roles" },
    tasks: { title: "Tasks", sub: "View, assign, and manage all tasks" },
  };

  /* ── Brand handlers ── */
  const handleAddBrand = (b: Omit<Brand, "id" | "createdAt">) => {
    setBrands((prev) => [
      ...prev,
      { ...b, id: `brand-${Date.now()}`, createdAt: new Date().toISOString().split("T")[0] },
    ]);
  };
  const handleEditBrand = (updated: Brand) => {
    setBrands((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };
  const handleDeleteBrand = (id: string) => {
    setBrands((prev) => prev.filter((b) => b.id !== id));
  };

  /* ── Employee handlers ── */
  const handleCreateEmployee = (emp: Omit<Employee, "id">) => {
    setEmployees((prev) => [...prev, { ...emp, id: `emp-${Date.now()}` }]);
  };
  const handleDeleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };
  const handleAssignRole = (id: string, role: Employee["role"]) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, role } : e)));
  };

  /* ── Task handlers ── */
  const handleStatusChange = (id: string, status: TaskStatus, remark?: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status, ...(remark !== undefined ? { rejectRemark: remark } : {}) }
          : t
      )
    );
  };
  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };
  const handleAddTask = (t: Omit<Task, "id" | "createdAt">) => {
    setTasks((prev) => [
      { ...t, id: `task-${Date.now()}`, createdAt: new Date().toISOString().split("T")[0] },
      ...prev,
    ]);
  };
  const handleEditTask = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };
  const handleAddChange = (taskId: string, note: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              changes: [
                ...t.changes,
                {
                  id: `ch-${Date.now()}`,
                  changedAt: new Date().toISOString().split("T")[0],
                  changedBy: "Super Admin",
                  note,
                },
              ],
            }
          : t
      )
    );
  };

  return (
    <SALayout
      activeSection={section}
      onSectionChange={setSection}
      pageTitle={sectionTitles[section].title}
      pageSub={sectionTitles[section].sub}
    >
      {section === "dashboard" && (
        <>
          <SAStatsCards employees={employees} tasks={tasks} brands={brands} />
          <div className={styles.dashGrid}>
            <div className={styles.dashLeft}>
              <SATasks
                tasks={tasks.slice(0, 5)}
                employees={employees}
                brands={brands}
                onStatusChange={handleStatusChange}
                onDeleteTask={handleDeleteTask}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                onAddChange={handleAddChange}
              />
            </div>
            <div className={styles.dashRight}>
              <div className={styles.quickCard}>
                <h3 className={styles.quickTitle}>Quick Stats</h3>
                {[
                  {
                    label: "Active Employees",
                    val: employees.filter((e) => e.isActive).length,
                    color: "#10b981",
                  },
                  {
                    label: "Admins",
                    val: employees.filter((e) => e.role === "admin").length,
                    color: "#6366f1",
                  },
                  {
                    label: "Active Brands",
                    val: brands.filter((b) => b.status === "active").length,
                    color: "#f59e0b",
                  },
                  {
                    label: "This Month Tasks",
                    val: tasks.filter((t) =>
                      t.createdAt.startsWith(new Date().toISOString().slice(0, 7))
                    ).length,
                    color: "#3b82f6",
                  },
                ].map((item) => (
                  <div key={item.label} className={styles.quickRow}>
                    <span className={styles.quickLabel}>{item.label}</span>
                    <span className={styles.quickVal} style={{ color: item.color }}>
                      {item.val}
                    </span>
                  </div>
                ))}
              </div>

              <div className={styles.quickCard}>
                <h3 className={styles.quickTitle}>Recent Employees</h3>
                {employees.slice(0, 4).map((emp) => (
                  <div key={emp.id} className={styles.recentEmpRow}>
                    <div className={styles.recentAvatar}>{emp.name[0]}</div>
                    <div>
                      <div className={styles.recentName}>{emp.name}</div>
                      <div className={styles.recentDept}>{emp.department}</div>
                    </div>
                    <span
                      className={`${styles.recentRole} ${
                        emp.role === "super_admin"
                          ? styles.rSA
                          : emp.role === "admin"
                          ? styles.rAdmin
                          : styles.rEmp
                      }`}
                    >
                      {emp.role === "super_admin"
                        ? "Super Admin"
                        : emp.role === "admin"
                        ? "Admin"
                        : "Employee"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {section === "brands" && (
        <SABrands
          brands={brands}
          onAdd={handleAddBrand}
          onEdit={handleEditBrand}
          onDelete={handleDeleteBrand}
        />
      )}

      {section === "employees" && (
        <SAEmployees
          employees={employees}
          tasks={tasks}
          brands={brands}
          onCreateEmployee={handleCreateEmployee}
          onDeleteEmployee={handleDeleteEmployee}
          onAssignRole={handleAssignRole}
        />
      )}

      {section === "tasks" && (
        <SATasks
          tasks={tasks}
          employees={employees}
          brands={brands}
          onStatusChange={handleStatusChange}
          onDeleteTask={handleDeleteTask}
          onAddTask={handleAddTask}
          onEditTask={handleEditTask}
          onAddChange={handleAddChange}
        />
      )}
    </SALayout>
  );
}