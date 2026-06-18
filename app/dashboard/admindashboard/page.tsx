"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/admindahboardcomponents/Sidebar";
import StatsCards from "@/components/dashboard/admindahboardcomponents/Statscards";
import TaskTable from "@/components/dashboard/admindahboardcomponents/Tasktable";
import EmployeeList from "@/components/dashboard/admindahboardcomponents/Employeelist";
import AssignTask from "@/components/dashboard/admindahboardcomponents/Assigntask";
import {
  employees as initialEmployees,
  tasks as initialTasks,
  getDashboardStats,
} from "@/lib/Mockdata";
import { Task, TaskStatus, TaskFrequency } from "@/types/admin/Crm";
import styles from "@/public/assets/styles/dashboard/admindashboard/admindashboard.module.css";

type ActiveSection = "dashboard" | "employees" | "tasks" | "assign";

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<ActiveSection>("dashboard");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const stats = {
    totalEmployees: initialEmployees.length,
    totalTasks: tasks.length,
    pendingTasks: tasks.filter((t) => t.status === "pending").length,
    approvedTasks: tasks.filter((t) => t.status === "approved").length,
    rejectedTasks: tasks.filter((t) => t.status === "rejected").length,
  };

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );
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
                  changedBy: "Admin",
                  note,
                },
              ],
            }
          : t
      )
    );
  };

  const handleAssignTask = (data: {
    title: string;
    description: string;
    assignedTo: string;
    frequency: TaskFrequency;
    dueDate: string;
  }) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      ...data,
      status: "pending",
      deliveryStatus: "not_delivered",
      changes: [],
      createdAt: new Date().toISOString().split("T")[0],
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const sectionTitles: Record<ActiveSection, string> = {
    dashboard: "Dashboard Overview",
    employees: "Employees",
    tasks: "Task Management",
    assign: "Assign Task",
  };

  return (
    <div className={styles.layout}>
      <Sidebar
        activeSection={activeSection}
        onSectionChange={(s) => setActiveSection(s as ActiveSection)}
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
        <div className={styles.content}>
          {/* Stats always visible on dashboard */}
          {(activeSection === "dashboard" || activeSection === "tasks") && (
            <StatsCards stats={stats} />
          )}

          {activeSection === "dashboard" && (
            <>
              <TaskTable
                tasks={tasks}
                employees={initialEmployees}
                onStatusChange={handleStatusChange}
                onAddChange={handleAddChange}
              />
              <EmployeeList employees={initialEmployees} tasks={tasks} />
            </>
          )}

          {activeSection === "employees" && (
            <EmployeeList employees={initialEmployees} tasks={tasks} />
          )}

          {activeSection === "tasks" && (
            <TaskTable
              tasks={tasks}
              employees={initialEmployees}
              onStatusChange={handleStatusChange}
              onAddChange={handleAddChange}
            />
          )}

          {activeSection === "assign" && (
            <AssignTask
              employees={initialEmployees}
              onAssign={handleAssignTask}
            />
          )}
        </div>
      </main>
    </div>
  );
}