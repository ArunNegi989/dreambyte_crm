"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Employee, Task, Brand } from "@/types/superadmin/superAdmin";
import SACreateEmployeeModal from "./SACreateEmployeeModal";
import SAAssignRoleModal from "./SAAssignRoleModal";
import SAEmployeeDetailModal from "./SAEmployeeDetailModal";
import SAEmployeeProgressModal from "./Saemployeeprogressmodal";
import styles from "@/public/assets/styles/dashboard/super-admin-dashboard/Saemployees.module.css";

interface SAEmployeesProps {
  tasks: Task[];
  brands: Brand[];
  onCreated?: (e: Employee) => void;
  onDeleted?: (id: string) => void;
  onRoleAssigned?: (id: string, role: Employee["role"]) => void;
}

export default function SAEmployees({ tasks, brands, onCreated, onDeleted, onRoleAssigned }: SAEmployeesProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const [showCreate, setShowCreate]       = useState(false);
  const [viewEmp, setViewEmp]             = useState<Employee | null>(null);
  const [progressEmp, setProgressEmp]     = useState<Employee | null>(null);
  const [roleEmp, setRoleEmp]             = useState<Employee | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting]           = useState<string | null>(null);
  const [search, setSearch]               = useState("");

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/employees");
      setEmployees(res.data.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load employees";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreated = (emp: Employee) => {
    setEmployees((prev) => [emp, ...prev]);
    setShowCreate(false);
    onCreated?.(emp);
  };

  const handleRoleAssigned = (id: string, role: Employee["role"]) => {
    setEmployees((prev) =>
      prev.map((e) => (e._id === id ? { ...e, role } : e))
    );
    onRoleAssigned?.(id, role);
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      await api.delete(`/employees/${id}`);
      setEmployees((prev) => prev.filter((e) => e._id !== id));
      onDeleted?.(id);
      setDeleteConfirm(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete employee";
      setError(msg);
    } finally {
      setDeleting(null);
    }
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase())
  );

  // Fix: assignedTo can be a populated object OR a plain string id
  const getEmpTasks = (empId: string) =>
    tasks.filter((t) => {
      const id =
        typeof t.assignedTo === "object" && t.assignedTo !== null
          ? (t.assignedTo as { _id: string })._id
          : t.assignedTo;
      return id === empId;
    });

  const roleColorMap: Record<string, string> = {
    super_admin: styles.roleSA,
    admin:       styles.roleAdmin,
    employee:    styles.roleEmp,
  };

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Employees</h2>
          <p className={styles.sub}>
            {loading ? "Loading..." : `${employees.length} team members`}
          </p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className={styles.searchInput}
              placeholder="Search employees…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className={styles.addBtn} onClick={() => setShowCreate(true)} disabled={loading}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Employee
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className={styles.errorBanner}>
          <span>⚠️ {error}</span>
          <button onClick={loadEmployees}>Retry</button>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading employees...</p>
        </div>
      )}

      {/* ── Table ── */}
      {!loading && (
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
                const empTasks = getEmpTasks(emp._id);
                return (
                  <tr key={emp._id}>
                    {/* Employee Info */}
                    <td>
                      <div className={styles.empCell}>
                        <div className={styles.empAvatar}>{emp.name[0]}</div>
                        <div>
                          <div className={styles.empName}>{emp.name}</div>
                          <div className={styles.empEmail}>{emp.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Emp ID */}
                    <td>
                      <span className={styles.empIdBadge}>{emp.employeeId}</span>
                    </td>

                    {/* Department */}
                    <td>{emp.department}</td>

                    {/* Role */}
                    <td>
                      <span className={`${styles.roleBadge} ${roleColorMap[emp.role] ?? ""}`}>
                        {emp.role === "super_admin"
                          ? "Super Admin"
                          : emp.role === "admin"
                          ? "Admin"
                          : "Employee"}
                      </span>
                    </td>

                    {/* Tasks */}
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

                    {/* Status */}
                    <td>
                      <span className={`${styles.statusDot} ${emp.isActive ? styles.dotActive : styles.dotInactive}`}>
                        {emp.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className={styles.actions}>
                        {/* View */}
                        <button
                          className={styles.eyeBtn}
                          onClick={() => setViewEmp(emp)}
                          title="View details"
                          disabled={deleting === emp._id}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>

                        {/* Progress Report */}
                        <button
                          className={styles.assignBtn}
                          onClick={() => setProgressEmp(emp)}
                          title="View progress report"
                          disabled={deleting === emp._id}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 20V10" />
                            <path d="M12 20V4" />
                            <path d="M6 20v-6" />
                          </svg>
                        </button>

                        {/* Assign Role */}
                        <button
                          className={styles.assignBtn}
                          onClick={() => setRoleEmp(emp)}
                          title="Assign role"
                          disabled={deleting === emp._id}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="8" r="4" />
                            <path d="M16 14a6 6 0 0 1-8 0" />
                            <line x1="18" y1="14" x2="18" y2="20" />
                            <line x1="15" y1="17" x2="21" y2="17" />
                          </svg>
                        </button>

                        {/* Delete */}
                        {deleteConfirm === emp._id ? (
                          <div className={styles.confirmRow}>
                            <button
                              className={styles.confirmYes}
                              onClick={() => handleDelete(emp._id)}
                              disabled={deleting === emp._id}
                            >
                              {deleting === emp._id ? "..." : "Yes"}
                            </button>
                            <button
                              className={styles.confirmNo}
                              onClick={() => setDeleteConfirm(null)}
                              disabled={deleting === emp._id}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            className={styles.deleteBtn}
                            onClick={() => setDeleteConfirm(emp._id)}
                            title="Delete employee"
                            disabled={deleting === emp._id}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M9 6V4h6v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && !error && (
                <tr>
                  <td colSpan={7} className={styles.empty}>
                    {search
                      ? "No employees match your search."
                      : 'No employees yet. Click "Add Employee" to get started.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modals ── */}
      {showCreate && (
        <SACreateEmployeeModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {viewEmp && (
        <SAEmployeeDetailModal
          employee={viewEmp}
          tasks={tasks}
          brands={brands}
          onClose={() => setViewEmp(null)}
        />
      )}

      {progressEmp && (
        <SAEmployeeProgressModal
          employee={progressEmp}
          tasks={tasks}
          brands={brands}
          onClose={() => setProgressEmp(null)}
        />
      )}

      {roleEmp && (
        <SAAssignRoleModal
          employee={roleEmp}
          onClose={() => setRoleEmp(null)}
          onAssign={handleRoleAssigned}
        />
      )}
    </div>
  );
}