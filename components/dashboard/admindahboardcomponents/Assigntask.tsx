"use client";

import { useState } from "react";
import { Employee, TaskFrequency ,Brand  } from "@/types/admin/Crm";
import { getTasksForDepartment } from "@/data/superadmin/departmentTasks";
import styles from "@/public/assets/styles/dashboard/admindashboard/Assigntask.module.css";

interface AssignTaskProps {
  employees: Employee[];
  brands: Brand[];
  onAssign: (data: {
    title: string;
    description: string;
    brandId: string;
    assignedTo: string;
    frequency: TaskFrequency;
    dueDate: string;
  }) => void;
}

export default function AssignTask({ employees, brands, onAssign }: AssignTaskProps) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
     brandId: "",
    frequency: "weekly" as TaskFrequency,
    dueDate: "",
  });
  const [success, setSuccess] = useState(false);

  // Admin can only assign tasks to plain employees — never to another
  // admin, and never to a super admin. Guarded with `?? []` because on
  // first render (before the parent's fetch resolves) `employees` can
  // still be undefined.
  const assignableEmployees = (employees ?? []).filter((emp) => emp.role === "employee");

  // ── Department-aware "Assign To" ─────────────────────────────────────────
  // Looks up the currently selected employee so we can show their
  // department and a department-specific work-type dropdown.
  const selectedEmployee = assignableEmployees.find((e) => e._id === form.assignedTo);
  const departmentTasks = getTasksForDepartment(selectedEmployee?.department);
  // Keeps the Work Type <select> controlled: if the current title matches
  // one of this department's task options, show it selected; otherwise
  // blank (e.g. admin typed a custom title).
  const workTypeValue = departmentTasks.includes(form.title) ? form.title : "";

  // When the employee changes, the department (and therefore the work-type
  // list) changes too. Clear the title only if it no longer belongs to the
  // new department's task list, so admin doesn't accidentally submit a
  // mismatched title.
  const handleAssignedToChange = (empId: string) => {
    const newEmp = assignableEmployees.find((e) => e._id === empId);
    const newDeptTasks = getTasksForDepartment(newEmp?.department);
    setForm((prev) => ({
      ...prev,
      assignedTo: empId,
      title: newDeptTasks.includes(prev.title) ? prev.title : "",
    }));
  };

  const handleSubmit = () => {
    if (!form.title || !form.assignedTo ||!form.brandId || !form.dueDate) return;
    onAssign(form);
    setForm({ title: "", description: "", assignedTo: "", brandId: "", frequency: "weekly", dueDate: "" });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </div>
        <div>
          <h2 className={styles.title}>Assign New Task</h2>
          <p className={styles.subtitle}>Fill in the details to assign a task to an employee</p>
        </div>
      </div>

      {success && (
        <div className={styles.successMsg}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          Task assigned successfully!
        </div>
      )}

      <div className={styles.form}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Assign To *</label>
            <select
              className={styles.input}
              value={form.assignedTo}
              onChange={(e) => handleAssignedToChange(e.target.value)}
            >
              <option value="">Select Employee</option>
              {assignableEmployees.map((emp) => (
                // ← _id use ho raha hai
                <option key={emp._id} value={emp._id}>
                  {emp.name} — {emp.role}
                </option>
              ))}
            </select>
          </div>

          {/* Department — auto-filled, read-only, only shown once an employee is picked */}
          {selectedEmployee && (
            <div className={styles.field}>
              <label className={styles.label}>Department</label>
              <input
                className={styles.input}
                value={selectedEmployee.department}
                disabled
                readOnly
              />
            </div>
          )}

          <div className={styles.field}>
  <label className={styles.label}>Brand *</label>
  <select
    className={styles.input}
    value={form.brandId}
    onChange={(e) =>
      setForm({ ...form, brandId: e.target.value })
    }
  >
    <option value="">Select Brand</option>

    {brands.map((brand) => (
      <option key={brand._id} value={brand._id}>
        {brand.name}
      </option>
    ))}
  </select>
</div>
{selectedEmployee && departmentTasks.length > 0 && (
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Work Type *</label>
              <select
                className={styles.input}
                value={workTypeValue}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              >
                <option value="">Select work type</option>
                {departmentTasks.map((wt) => (
                  <option key={wt} value={wt}>
                    {wt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        </div>

        {/* Work Type — department-specific dropdown, only shown when the
            department has a known task list. Selecting an option fills the
            Task Title below; admin can still edit it further. */}
        

        <div className={styles.field}>
          <label className={styles.label}>Task Title *</label>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g. Build Login Page"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            placeholder="Describe the task in detail..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Frequency *</label>
            <div className={styles.freqToggle}>
              <button
                type="button"
                className={`${styles.freqBtn} ${form.frequency === "weekly" ? styles.freqActive : ""}`}
                onClick={() => setForm({ ...form, frequency: "weekly" })}
              >
                📅 Weekly
              </button>
              <button
                type="button"
                className={`${styles.freqBtn} ${form.frequency === "monthly" ? styles.freqActive : ""}`}
                onClick={() => setForm({ ...form, frequency: "monthly" })}
              >
                🗓️ Monthly
              </button>
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Due Date *</label>
            <input
              type="date"
              className={styles.input}
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
        </div>

        <button className={styles.submitBtn} onClick={handleSubmit}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          Assign Task
        </button>
      </div>
    </div>
  );
}