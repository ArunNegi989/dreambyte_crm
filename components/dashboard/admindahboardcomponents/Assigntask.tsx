"use client";

import { useState } from "react";
import { Employee, TaskFrequency, Brand } from "@/types/admin/Crm";
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
    department?: string;
    taskType?: string;
    location?: string;
    time?: string;
    mediaType?: "photo" | "video" | "both";
    totalCount?: string;
  }) => void;
}

const SHOOT_WORK_TYPES = ["Shoots"];
const EDIT_COUNT_WORK_TYPES = ["Photo Edit"];

const emptyForm = {
  title: "",
  description: "",
  assignedTo: "",
  brandId: "",
  frequency: "weekly" as TaskFrequency,
  dueDate: "",
  location: "",
  time: "",
  mediaType: "" as "" | "photo" | "video" | "both",
  totalCount: "",
};

export default function AssignTask({ employees, brands, onAssign }: AssignTaskProps) {
  const [form, setForm] = useState(emptyForm);
  const [workType, setWorkType] = useState("");
  const [success, setSuccess] = useState(false);

  const assignableEmployees = (employees ?? []).filter((emp) => emp.role === "employee");

  const selectedEmployee = assignableEmployees.find((e) => e._id === form.assignedTo);
  const departmentTasks = getTasksForDepartment(selectedEmployee?.department);
  const workTypeValue = departmentTasks.includes(workType) ? workType : "";

  const isShootWork = SHOOT_WORK_TYPES.includes(workType);
  const isEditCountWork = EDIT_COUNT_WORK_TYPES.includes(workType);

  const handleAssignedToChange = (empId: string) => {
    setForm((prev) => ({
      ...prev,
      assignedTo: empId,
      title: "",
      location: "",
      time: "",
      mediaType: "",
      totalCount: "",
    }));
    setWorkType("");
  };

  const handleWorkTypeChange = (wt: string) => {
    setWorkType(wt);
    setForm((prev) => ({
      ...prev,
      title: wt,
      location: SHOOT_WORK_TYPES.includes(wt) ? prev.location : "",
      time: SHOOT_WORK_TYPES.includes(wt) ? prev.time : "",
      mediaType: SHOOT_WORK_TYPES.includes(wt) ? prev.mediaType : "",
      totalCount: EDIT_COUNT_WORK_TYPES.includes(wt) ? prev.totalCount : "",
    }));
  };

  const handleSubmit = () => {
    if (!form.title || !form.assignedTo || !form.brandId || !form.dueDate) return;

    onAssign({
      title: form.title,
      description: form.description,
      assignedTo: form.assignedTo,
      brandId: form.brandId,
      frequency: form.frequency,
      dueDate: form.dueDate,
      department: selectedEmployee?.department,
      taskType: workType || undefined,
      location: isShootWork ? form.location : undefined,
      time: isShootWork ? form.time : undefined,
      mediaType: isShootWork && form.mediaType ? form.mediaType : undefined,
      totalCount: isEditCountWork && form.totalCount ? form.totalCount : undefined,
    });

    setForm(emptyForm);
    setWorkType("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const canSubmit = Boolean(form.title && form.assignedTo && form.brandId && form.dueDate);

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
                <option key={emp._id} value={emp._id}>
                  {emp.name} — {emp.department}
                </option>
              ))}
            </select>
          </div>

          {selectedEmployee && (
            <div className={styles.field}>
              <label className={styles.label}>Department</label>
              <input className={styles.input} value={selectedEmployee.department} disabled readOnly />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Brand *</label>
            <select
              className={styles.input}
              value={form.brandId}
              onChange={(e) => setForm({ ...form, brandId: e.target.value })}
            >
              <option value="">Select Brand</option>
              {brands.map((brand) => (
                <option key={brand._id} value={brand._id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedEmployee && departmentTasks.length > 0 && (
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Work Type *</label>
              <select
                className={styles.input}
                value={workTypeValue}
                onChange={(e) => handleWorkTypeChange(e.target.value)}
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

        {isShootWork && (
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Shoot Location</label>
              <input
                className={styles.input}
                placeholder="e.g. Rishikesh Riverside Studio"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Shoot Time</label>
              <input
                className={styles.input}
                placeholder="e.g. 10:30 AM"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Media Type</label>
              <select
                className={styles.input}
                value={form.mediaType}
                onChange={(e) =>
                  setForm({ ...form, mediaType: e.target.value as "" | "photo" | "video" | "both" })
                }
              >
                <option value="">Select type</option>
                <option value="photo">Photo</option>
                <option value="video">Video</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
        )}

        {isEditCountWork && (
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Total Photos to Edit *</label>
              <input
                type="number"
                min={1}
                className={styles.input}
                placeholder="e.g. 40"
                value={form.totalCount}
                onChange={(e) => setForm({ ...form, totalCount: e.target.value })}
              />
            </div>
          </div>
        )}

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
          <label className={styles.label}>Description {isShootWork ? "/ Notes" : ""}</label>
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            placeholder={isShootWork ? "Any notes for the shoot…" : "Describe the task in detail..."}
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

        <button className={styles.submitBtn} onClick={handleSubmit} disabled={!canSubmit}>
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