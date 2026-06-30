"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { logout } from "../../api/authApi";
import SALayout, { SASection } from "@/components/dashboard/super-admin/SALayout";
import SAStatsCards from "@/components/dashboard/super-admin/SAStatsCards";
import SABrands from "@/components/dashboard/super-admin/SABrands";
import SAEmployees from "@/components/dashboard/super-admin/SAEmployees";
import SATasks from "@/components/dashboard/super-admin/SATasks";
import { Brand, Employee, Task, TaskStatus } from "@/types/superadmin/superAdmin";
import styles from "@/app/dashboard/superadmindashboard/superadmindashboard.module.css";

export default function SuperAdminPage() {
  const router = useRouter();
  const [section, setSection] = useState<SASection>("dashboard");

  // ── Global Data ───────────────────────────────────────────────────────────
  const [brands, setBrands] = useState<Brand[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Load All ──────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [brandsRes, employeesRes, tasksRes] = await Promise.all([
        api.get("/brands"),
        api.get("/employees"),
        api.get("/tasks"),
      ]);
      setBrands(brandsRes.data.data);
      setEmployees(employeesRes.data.data);
      setTasks(tasksRes.data.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const sectionTitles: Record<SASection, { title: string; sub: string }> = {
    dashboard: { title: "Super Admin Dashboard", sub: "Full platform overview" },
    brands: { title: "Brands", sub: "Manage all client brands" },
    employees: { title: "Employees", sub: "Manage team members and roles" },
    tasks: { title: "Tasks", sub: "View, assign, and manage all tasks" },
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  // Same flow as employee/admin dashboards: hit the logout endpoint, clear
  // local storage regardless of outcome, then redirect to login.
  const handleLogout = async () => {
    try {
      await logout("super_admin");
    } finally {
      localStorage.clear();
      router.push("/auth/login");
    }
  };

  // ── Brand callbacks (SABrands is self-contained, these sync dashboard state)
  const handleBrandCreated = (b: Brand) => setBrands((p) => [b, ...p]);
  const handleBrandUpdated = (b: Brand) =>
    setBrands((p) => p.map((x) => (x._id === b._id ? b : x)));
  const handleBrandDeleted = (id: string) =>
    setBrands((p) => p.filter((x) => x._id !== id));

  // ── Employee callbacks (SAEmployees is self-contained)
  const handleEmployeeCreated = (e: Employee) => setEmployees((p) => [e, ...p]);
  const handleEmployeeDeleted = (id: string) =>
    setEmployees((p) => p.filter((x) => x._id !== id));
  const handleRoleAssigned = (id: string, role: Employee["role"]) =>
    setEmployees((p) => p.map((x) => (x._id === id ? { ...x, role } : x)));

  // ── Task handlers ─────────────────────────────────────────────────────────
  const handleStatusChange = async (
    id: string,
    status: TaskStatus,
    remark?: string,
    changedBy?: string
  ) => {
    try {
      const res = await api.put(`/tasks/${id}`, {
        status,
        ...(remark !== undefined ? { rejectRemark: remark } : {}),
        ...(changedBy !== undefined ? { changedBy } : {}),
      });
      setTasks((p) => p.map((t) => (t._id === id ? res.data.data : t)));
    } catch (err) {
      console.error("Status update failed", err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((p) => p.filter((t) => t._id !== id));
    } catch (err) {
      console.error("Delete task failed", err);
    }
  };

  const handleAddTask = async (
    t: Omit<Task, "_id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const res = await api.post("/tasks", t);
      setTasks((p) => [res.data.data, ...p]);
    } catch (err) {
      console.error("Add task failed", err);
    }
  };

  const handleEditTask = async (updated: Task) => {
    try {
      const res = await api.put(`/tasks/${updated._id}`, updated);
      setTasks((p) =>
        p.map((t) => (t._id === updated._id ? res.data.data : t))
      );
    } catch (err) {
      console.error("Edit task failed", err);
    }
  };

  // ── Employee replies to a rejection / change-log entry ──────────────────
  const handleRespondChange = async (
    taskId: string,
    changeId: string,
    response: string
  ) => {
    try {
      const res = await api.post(`/tasks/${taskId}/respond`, {
        responses: [{ id: changeId, response }],
      });
      setTasks((p) => p.map((t) => (t._id === taskId ? res.data.data : t)));
    } catch (err) {
      console.error("Respond to change failed", err);
    }
  };

  const handleDeliverTask = async (taskId: string, note: string) => {
    try {
      const res = await api.post(`/tasks/${taskId}/deliver`, { deliveryNote: note });
      setTasks((p) => p.map((t) => (t._id === taskId ? res.data.data : t)));
    } catch (err) {
      console.error("Deliver task failed", err);
    }
  };

  // ── Loading / Error screens ───────────────────────────────────────────────
  if (loading) {
    return (
      <SALayout
        activeSection={section}
        onSectionChange={setSection}
        pageTitle={sectionTitles[section].title}
        pageSub={sectionTitles[section].sub}
        onLogout={handleLogout}
      >
        <div className={styles.pageLoader}>
          <div className={styles.pageSpinner} />
          <p>Loading dashboard...</p>
        </div>
      </SALayout>
    );
  }

  if (error) {
    return (
      <SALayout
        activeSection={section}
        onSectionChange={setSection}
        pageTitle={sectionTitles[section].title}
        pageSub={sectionTitles[section].sub}
        onLogout={handleLogout}
      >
        <div className={styles.pageError}>
          <span>⚠️ {error}</span>
          <button onClick={loadAll}>Retry</button>
        </div>
      </SALayout>
    );
  }

  return (
    <SALayout
      activeSection={section}
      onSectionChange={setSection}
      pageTitle={sectionTitles[section].title}
      pageSub={sectionTitles[section].sub}
      onLogout={handleLogout}
    >
      {/* ── Dashboard ── */}
      {section === "dashboard" && (
        <>
          <SAStatsCards employees={employees} tasks={tasks} brands={brands} />
          <div className={styles.dashGrid}>
            <div className={styles.dashLeft}>
              <SATasks
                tasks={tasks.slice(0, 5)}
                employees={employees}
                brands={brands}
                viewerRole="super_admin"
                onStatusChange={handleStatusChange}
                onDeleteTask={handleDeleteTask}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                onRespondChange={handleRespondChange}
                onDeliverTask={handleDeliverTask}
              />
            </div>
            <div className={styles.dashRight}>
              {/* Quick Stats */}
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
                      t.createdAt?.startsWith(new Date().toISOString().slice(0, 7))
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

              {/* Recent Employees */}
              <div className={styles.quickCard}>
                <h3 className={styles.quickTitle}>Recent Employees</h3>
                {employees.slice(0, 4).map((emp) => (
                  <div key={emp._id} className={styles.recentEmpRow}>
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
                {employees.length === 0 && (
                  <p className={styles.noData}>No employees yet.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Brands ── */}
      {section === "brands" && (
        <SABrands
          onCreated={handleBrandCreated}
          onUpdated={handleBrandUpdated}
          onDeleted={handleBrandDeleted}
        />
      )}

      {/* ── Employees ── */}
      {section === "employees" && (
        <SAEmployees
          tasks={tasks}
          brands={brands}
          onCreated={handleEmployeeCreated}
          onDeleted={handleEmployeeDeleted}
          onRoleAssigned={handleRoleAssigned}
        />
      )}

      {/* ── Tasks ── */}
      {section === "tasks" && (
        <SATasks
          tasks={tasks}
          employees={employees}
          brands={brands}
          viewerRole="super_admin"
          onStatusChange={handleStatusChange}
          onDeleteTask={handleDeleteTask}
          onAddTask={handleAddTask}
          onEditTask={handleEditTask}
          onRespondChange={handleRespondChange}
          onDeliverTask={handleDeliverTask}
        />
      )}
    </SALayout>
  );
}