"use client";

import { useState } from "react";
import { DashboardStats, Task, Employee } from "@/types/admin/Crm";
import type { JSX } from "react";
import styles from "@/public/assets/styles/dashboard/admindashboard/Statscards.module.css";

interface StatsCardsProps {
  stats: DashboardStats;
  tasks: Task[];
  employees: Employee[];
  adminTasksList: Task[];
}

type CardKey = "employees" | "total" | "pending" | "approved" | "rejected" | "admin";

export default function StatsCards({ stats, tasks, employees, adminTasksList }: StatsCardsProps) {
  const [expandedKey, setExpandedKey] = useState<CardKey | null>(null);

  const getAssignedId = (assignedTo: Task["assignedTo"]): string => {
    if (assignedTo && typeof assignedTo === "object") return (assignedTo as { _id: string })._id;
    return assignedTo as string;
  };

  const getEmployee = (assignedTo: Task["assignedTo"]): Employee | undefined => {
    const id = getAssignedId(assignedTo);
    return employees.find((e) => e._id === id);
  };

  const getTasksForKey = (key: CardKey): Task[] => {
    switch (key) {
      case "total":
        return tasks;
      case "pending":
        return tasks.filter((t) => t.status === "pending");
      case "approved":
        return tasks.filter((t) => t.status === "approved");
      case "rejected":
        return tasks.filter((t) => t.status === "rejected");
      case "admin":
        return adminTasksList;
      default:
        return [];
    }
  };

  const cards: {
    key: CardKey;
    label: string;
    value: number;
    icon: JSX.Element;
    color: string;
  }[] = [
    {
      key: "employees",
      label: "Total Employees",
      value: stats.totalEmployees,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      color: "blue",
    },
    {
      key: "total",
      label: "Total Tasks",
      value: stats.totalTasks,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      color: "purple",
    },
    {
      key: "pending",
      label: "Pending Tasks",
      value: stats.pendingTasks,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      color: "yellow",
    },
    {
      key: "approved",
      label: "Approved Tasks",
      value: stats.approvedTasks,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      color: "green",
    },
    {
      key: "rejected",
      label: "Rejected Tasks",
      value: stats.rejectedTasks,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
      color: "red",
    },
    {
      key: "admin",
      label: "Admin Tasks",
      value: stats.adminTasks,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 7h-9" />
          <path d="M14 17H5" />
          <circle cx="17" cy="17" r="3" />
          <circle cx="7" cy="7" r="3" />
        </svg>
      ),
      color: "indigo",
    },
  ];

  const activeCard = cards.find((c) => c.key === expandedKey);

  return (
    <div className={styles.wrapper}>
      <div className={styles.grid}>
        {cards.map((card) => (
          <button
            key={card.key}
            type="button"
            className={`${styles.card} ${styles[card.color]} ${expandedKey === card.key ? styles.cardActive : ""}`}
            onClick={() => setExpandedKey((prev) => (prev === card.key ? null : card.key))}
          >
            <div className={styles.cardHeader}>
              <span className={styles.label}>{card.label}</span>
              <div className={styles.iconWrap}>{card.icon}</div>
            </div>
            <div className={styles.value}>{card.value}</div>
            <div className={styles.subtext}>Tap to view details</div>
          </button>
        ))}
      </div>

      {activeCard && (
        <div className={styles.detailPanel}>
          <div className={styles.detailHeader}>
            <h3 className={styles.detailTitle}>{activeCard.label}</h3>
            <button className={styles.detailClose} onClick={() => setExpandedKey(null)}>
              ✕
            </button>
          </div>

          <div className={styles.detailList}>
            {expandedKey === "employees" ? (
              employees.length === 0 ? (
                <p className={styles.detailEmpty}>No employees found.</p>
              ) : (
                employees.map((emp) => (
                  <div key={emp._id} className={styles.detailRow}>
                    <div className={styles.detailAvatar}>{emp.name.charAt(0)}</div>
                    <div className={styles.detailInfo}>
                      <span className={styles.detailName}>{emp.name}</span>
                      <span className={styles.detailMeta}>
                        {emp.department} · {emp.role}
                      </span>
                    </div>
                    <span
                      className={`${styles.detailPill} ${emp.isActive ? styles.pillActive : styles.pillInactive}`}
                    >
                      {emp.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))
              )
            ) : getTasksForKey(expandedKey as CardKey).length === 0 ? (
              <p className={styles.detailEmpty}>No tasks found.</p>
            ) : (
              getTasksForKey(expandedKey as CardKey).map((task) => {
                const emp = getEmployee(task.assignedTo);
                return (
                  <div key={task._id} className={styles.detailRow}>
                    <div className={styles.detailAvatar}>{(emp?.name ?? "?").charAt(0)}</div>
                    <div className={styles.detailInfo}>
                      <span className={styles.detailName}>{task.title}</span>
                      <span className={styles.detailMeta}>
                        {emp ? `${emp.name} · ${emp.department} · ${emp.role}` : "Unassigned"}
                      </span>
                    </div>
                    <span className={`${styles.detailPill} ${styles[`status_${task.status}`] ?? ""}`}>
                      {task.status.replace("_", " ")}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}