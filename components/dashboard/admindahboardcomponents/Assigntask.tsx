"use client";

import { useState } from "react";
import { Employee, TaskFrequency } from "@/types/admin/Crm";
import styles from "@/public/assets/styles/dashboard/admindashboard/Assigntask.module.css";

interface AssignTaskProps {
  employees: Employee[];
  onAssign: (data: {
    title: string;
    description: string;
    assignedTo: string;
    frequency: TaskFrequency;
    dueDate: string;
  }) => void;
}

export default function AssignTask({ employees, onAssign }: AssignTaskProps) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    frequency: "weekly" as TaskFrequency,
    dueDate: "",
  });
  const [success, setSuccess] = useState(false);

  const handleSubmit = () => {
    if (!form.title || !form.assignedTo || !form.dueDate) return;
    onAssign(form);
    setForm({ title: "", description: "", assignedTo: "", frequency: "weekly", dueDate: "" });
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
            <label className={styles.label}>Assign To *</label>
            <select
              className={styles.input}
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} — {emp.role}
                </option>
              ))}
            </select>
          </div>
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