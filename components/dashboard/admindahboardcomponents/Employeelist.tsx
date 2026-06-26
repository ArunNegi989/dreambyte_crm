"use client";

import { useState } from "react";
import { Employee, Task, EmployeeWithStats } from "@/types/admin/Crm";
import EmployeeModal from "@/components/dashboard/admindahboardcomponents/Employeemodal";
import styles from "@/public/assets/styles/dashboard/admindashboard/Employeelist.module.css";

interface EmployeeListProps {
  employees: Employee[];
  tasks: Task[];
}

export default function EmployeeList({ employees, tasks }: EmployeeListProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithStats | null>(null);

  // Resolve assignedTo — could be populated object or plain string _id
  const getAssignedId = (assignedTo: Task["assignedTo"]): string => {
    if (typeof assignedTo === "object" && assignedTo !== null) {
      return assignedTo._id;
    }
    return assignedTo;
  };

  const getEmployeeWithStats = (emp: Employee): EmployeeWithStats => {
    const empTasks = tasks.filter((t) => getAssignedId(t.assignedTo) === emp._id);
    return {
      ...emp,
      totalTasks: empTasks.length,
      approvedTasks: empTasks.filter((t) => t.status === "approved").length,
      pendingTasks: empTasks.filter((t) => t.status === "pending").length,
      rejectedTasks: empTasks.filter((t) => t.status === "rejected").length,
      tasks: empTasks,
    };
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.tableHeader}>
          <h2 className={styles.title}>All Employees</h2>
          <span className={styles.count}>{employees.length} total</span>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Role</th>
                <th>Tasks</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const empTasks = tasks.filter(
                  (t) => getAssignedId(t.assignedTo) === emp._id
                );
                const approved = empTasks.filter((t) => t.status === "approved").length;
                const pending = empTasks.filter((t) => t.status === "pending").length;

                return (
                  <tr key={emp._id}>
                    <td>
                      <div className={styles.empCell}>
                        <div className={styles.empAvatar}>{emp.name.charAt(0)}</div>
                        <div className={styles.empDetails}>
                          <span className={styles.empName}>{emp.name}</span>
                          <span className={styles.empEmail}>{emp.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.dept}>{emp.department}</span>
                    </td>
                    <td>
                      <span className={styles.roleText}>{emp.role}</span>
                    </td>
                    <td>
                      <div className={styles.taskCountCell}>
                        <span className={styles.totalCount}>{empTasks.length} tasks</span>
                        <div className={styles.miniStats}>
                          <span className={styles.miniApproved}>{approved} ✓</span>
                          <span className={styles.miniPending}>{pending} ⏳</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusDot} ${pending > 0 ? styles.busy : styles.idle}`}>
                        {pending > 0 ? "Active" : "On Track"}
                      </span>
                    </td>
                    <td>
                      <button
                        className={styles.eyeBtn}
                        onClick={() => setSelectedEmployee(getEmployeeWithStats(emp))}
                        title="View employee details"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}

              {employees.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.empty}>No employees found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EmployeeModal
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
      />
    </>
  );
}