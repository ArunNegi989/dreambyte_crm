"use client";

import { useState } from "react";
import { Employee, Task } from "@/types/superadmin/superAdmin";
import SACreateEmployeeModal from "./SACreateEmployeeModal";
import SAAssignRoleModal from "./SAAssignRoleModal";
import SAEmployeeDetailModal from "./SAEmployeeDetailModal";
import styles from "@/public/assets/styles/dashboard/super-admin-dashboard/Saemployees.module.css";

// Import brands type for detail modal
import { Brand } from "@/types/superadmin/superAdmin";

interface SAEmployeesProps {
  employees: Employee[];
  tasks: Task[];
  brands: Brand[];
  onCreateEmployee: (emp: Omit<Employee, "id">) => void;
  onDeleteEmployee: (id: string) => void;
  onAssignRole: (id: string, role: Employee["role"]) => void;
}

export default function SAEmployees({
  employees, tasks, brands, onCreateEmployee, onDeleteEmployee, onAssignRole,
}: SAEmployeesProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [viewEmp, setViewEmp] = useState<Employee | null>(null);
  const [roleEmp, setRoleEmp] = useState<Employee | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (emp: Omit<Employee, "id">) => {
    onCreateEmployee(emp);
    return { employeeId: emp.employeeId, password: emp.password };
  };

  const getEmpTasks = (id: string) => tasks.filter((t) => t.assignedTo === id);

  const roleColors: Record<Employee["role"], string> = {
    super_admin: styles.roleSA,
    admin: styles.roleAdmin,
    employee: styles.roleEmp,
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Employees</h2>
          <p className={styles.sub}>{employees.length} team members</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className={styles.searchInput}
              placeholder="Search employees…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className={styles.addBtn} onClick={() => setShowCreate(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Employee
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Emp ID</th>
              <th>Department</th>
              <th>Role</th>
              <th>Tasks</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => {
              const empTasks = getEmpTasks(emp.id);
              return (
                <tr key={emp.id}>
                  <td>
                    <div className={styles.empCell}>
                      <div className={styles.empAvatar}>{emp.name[0]}</div>
                      <div>
                        <div className={styles.empName}>{emp.name}</div>
                        <div className={styles.empEmail}>{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.empIdBadge}>{emp.employeeId}</span>
                  </td>
                  <td>{emp.department}</td>
                  <td>
                    <span className={`${styles.roleBadge} ${roleColors[emp.role]}`}>
                      {emp.role === "super_admin" ? "Super Admin" : emp.role === "admin" ? "Admin" : "Employee"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.taskCount}>
                      <span className={styles.totalTask}>{empTasks.length}</span>
                      <div className={styles.miniBreak}>
                        <span className={styles.mini} style={{ color: "#10b981" }}>
                          {empTasks.filter((t) => t.status === "completed").length}✓
                        </span>
                        <span className={styles.mini} style={{ color: "#f59e0b" }}>
                          {empTasks.filter((t) => t.status === "pending").length}⏳
                        </span>
                        <span className={styles.mini} style={{ color: "#ef4444" }}>
                          {empTasks.filter((t) => t.status === "rejected").length}✕
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.statusDot} ${emp.isActive ? styles.dotActive : styles.dotInactive}`}>
                      {emp.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      {/* Eye — View Details */}
                      <button
                        className={styles.eyeBtn}
                        onClick={() => setViewEmp(emp)}
                        title="View details"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>

                      {/* Assign Role */}
                      <button
                        className={styles.assignBtn}
                        onClick={() => setRoleEmp(emp)}
                        title="Assign role"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M16 14a6 6 0 0 1-8 0" />
                          <line x1="18" y1="14" x2="18" y2="20" />
                          <line x1="15" y1="17" x2="21" y2="17" />
                        </svg>
                      </button>

                      {/* Delete */}
                      {deleteConfirm === emp.id ? (
                        <div className={styles.confirmRow}>
                          <button
                            className={styles.confirmYes}
                            onClick={() => { onDeleteEmployee(emp.id); setDeleteConfirm(null); }}
                          >
                            Yes
                          </button>
                          <button
                            className={styles.confirmNo}
                            onClick={() => setDeleteConfirm(null)}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          className={styles.deleteBtn}
                          onClick={() => setDeleteConfirm(emp.id)}
                          title="Delete employee"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6" /><path d="M14 11v6" />
                            <path d="M9 6V4h6v2" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.empty}>No employees found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modals ── */}

      {/* 1. Create Employee */}
      {showCreate && (
        <SACreateEmployeeModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreate}
        />
      )}

      {/* 2. View Employee Detail — SAEmployeeDetailModal */}
      {viewEmp && (
        <SAEmployeeDetailModal
          employee={viewEmp}
          tasks={tasks}
          brands={brands}
          onClose={() => setViewEmp(null)}
        />
      )}

      {/* 3. Assign Role — SAAssignRoleModal */}
      {roleEmp && (
        <SAAssignRoleModal
          employee={roleEmp}
          onClose={() => setRoleEmp(null)}
          onAssign={(id, role) => {
            onAssignRole(id, role);
            setRoleEmp(null);
          }}
        />
      )}
    </div>
  );
}