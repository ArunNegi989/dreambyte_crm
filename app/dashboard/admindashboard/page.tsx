"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { logout } from "../../api/authApi";
import Sidebar from "@/components/dashboard/admindahboardcomponents/Sidebar";
import StatsCards from "@/components/dashboard/admindahboardcomponents/Statscards";
import TaskTable from "@/components/dashboard/admindahboardcomponents/Tasktable";
import EmployeeList from "@/components/dashboard/admindahboardcomponents/Employeelist";
import AssignTask from "@/components/dashboard/admindahboardcomponents/Assigntask";
import AdminTasks from "@/components/dashboard/admindahboardcomponents/Admintasks";
import { Employee, Task, TaskStatus, TaskFrequency, DashboardStats, Brand, } from "@/types/admin/Crm";
import styles from "@/public/assets/styles/dashboard/admindashboard/admindashboard.module.css";
import { useAuthGuard } from '../../../hooks/useAuthGuard';

type ActiveSection = "dashboard" | "employees" | "tasks" | "assign" | "admin_tasks";

export default function AdminDashboard() {
  const router = useRouter();
  useAuthGuard(['admin', 'super_admin']);

  const [activeSection, setActiveSectionState] = useState<ActiveSection>("dashboard");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const validSections: ActiveSection[] = ["dashboard", "employees", "tasks", "assign", "admin_tasks"];

  // Wraps setActiveSection so every change is also persisted — this is
  // what makes the active tab survive a page refresh.
  const setActiveSection = (section: ActiveSection) => {
    setActiveSectionState(section);
    try {
      localStorage.setItem("adminActiveSection", section);
    } catch {
      // ignore write failures (e.g. private browsing)
    }
  };

  // On mount, restore whichever tab was open before the refresh.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("adminActiveSection") as ActiveSection | null;
      if (saved && validSections.includes(saved)) {
        setActiveSectionState(saved);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Current logged-in admin's id ─────────────────────────────────────────
  // Adjust this if your login flow stores the user differently. Common
  // patterns: localStorage "user" JSON blob, or a decoded JWT payload.
  const [currentAdminId, setCurrentAdminId] = useState<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        setCurrentAdminId(parsed?._id || parsed?.id || "");
      }
    } catch {
      setCurrentAdminId("");
    }
  }, []);

  // ── Load Data ─────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [empRes, taskRes, brandRes] = await Promise.all([
        api.get("/employees"),
        api.get("/tasks"),
        api.get("/brands"),
      ]);
      setEmployees(empRes.data.data);
      setTasks(taskRes.data.data);
      setBrands(brandRes.data.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats: DashboardStats = {
    totalEmployees: employees.length,
    totalTasks: tasks.length,
    pendingTasks: tasks.filter((t) => t.status === "pending").length,
    approvedTasks: tasks.filter((t) => t.status === "approved").length,
    rejectedTasks: tasks.filter((t) => t.status === "rejected").length,
  };

  // Tasks that Super Admin assigned directly to this admin (for sidebar badge)
  const adminTaskCount = tasks.filter((t) => {
    const id = typeof t.assignedTo === "object" ? (t.assignedTo as { _id: string })._id : t.assignedTo;
    return (
      id === currentAdminId &&
      t.assignedBy === "super_admin" &&
      !(t as unknown as { parentTaskId?: string | null }).parentTaskId
    );
  }).length;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStatusChange = async (
    taskId: string,
    status: TaskStatus,
    remark?: string,
    changedBy?: string
  ) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, {
        status,
        ...(remark !== undefined ? { rejectRemark: remark } : {}),
        ...(changedBy !== undefined ? { changedBy } : {}),
      });
      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data.data : t)));
    } catch (err) {
      console.error("Status change failed", err);
    }
  };

  const handleAssignTask = async (data: {
    title: string;
    description: string;
    assignedTo: string;
    brandId: string;
    frequency: TaskFrequency;
    dueDate: string;
  }) => {
    try {
      const res = await api.post("/tasks", {
        ...data,
        assignedBy: "admin",
        status: "pending",
        deliveryStatus: "not_delivered",
        changes: [],
      });
      setTasks((prev) => [res.data.data, ...prev]);
    } catch (err) {
      console.error("Assign task failed", err);
    }
  };

  // Same flow as the employee dashboard: hit the logout endpoint, clear
  // local storage regardless of outcome, then bounce to login.
  const handleLogout = async () => {
    try {
      await logout("admin");
    } finally {
      localStorage.clear();
      router.push("/auth/login");
    }
  };

  const sectionTitles: Record<ActiveSection, string> = {
    dashboard: "Dashboard Overview",
    employees: "Employees",
    tasks: "Task Management",
    assign: "Assign Task",
    admin_tasks: "Tasks from Super Admin",
  };

  // ── Loading / Error ───────────────────────────────────────────────────────
  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading dashboard...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.errorState}>
          <span>⚠️ {error}</span>
          <button onClick={loadAll}>Retry</button>
        </div>
      );
    }

    return (
      <>
        {(activeSection === "dashboard" || activeSection === "tasks") && (
          <StatsCards stats={stats} />
        )}

        {activeSection === "dashboard" && (
          <>
            <TaskTable
              tasks={tasks}
              employees={employees}
              onStatusChange={handleStatusChange}
            />
            <EmployeeList employees={employees} tasks={tasks} />
          </>
        )}

        {activeSection === "employees" && (
          <EmployeeList employees={employees} tasks={tasks} />
        )}

        {activeSection === "tasks" && (
          <TaskTable
            tasks={tasks}
            employees={employees}
            onStatusChange={handleStatusChange}
          />
        )}

        {activeSection === "assign" && (
          <AssignTask employees={employees} brands={brands} onAssign={handleAssignTask} />
        )}

        {activeSection === "admin_tasks" && (
          <AdminTasks
            tasks={tasks}
            employees={employees}
            adminId={currentAdminId}
            onRefresh={loadAll}
          />
        )}
      </>
    );
  };

  return (
    <div className={styles.layout}>
      <Sidebar
        activeSection={activeSection}
        onSectionChange={(s) => setActiveSection(s)}
        adminTaskCount={adminTaskCount}
      />

      <main className={styles.main}>
        {/* Top Bar */}
        <div className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>{sectionTitles[activeSection]}</h1>
            <p className={styles.pageSub}>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className={styles.topBarRight}>
            <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="16" height="16">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Logout
            </button>
            <div className={styles.notifBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {stats.pendingTasks > 0 && (
                <span className={styles.notifDot}>{stats.pendingTasks}</span>
              )}
            </div>
            <div className={styles.adminPill}>
              <div className={styles.adminDot} />
              Admin
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>{renderContent()}</div>
      </main>
    </div>
  );
}