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

// ── One drafted task in the batch ────────────────────────────────────────
// Employee is picked once for the whole batch (see `assignedTo` state
// below) — each draft is just a Task(work type) + Brand pairing plus its
// own details, same shape SATasks's batch composer uses.
interface TaskDraft {
  id: string;
  workType: string;
  title: string;
  brandId: string;
  description: string;
  frequency: TaskFrequency;
  dueDate: string;
  location: string;
  time: string;
  mediaType: "" | "photo" | "video" | "both";
  totalCount: string;
}

const emptyDraft: Omit<TaskDraft, "id"> = {
  workType: "",
  title: "",
  brandId: "",
  description: "",
  frequency: "weekly",
  dueDate: "",
  location: "",
  time: "",
  mediaType: "",
  totalCount: "",
};

export default function AssignTask({ employees, brands, onAssign }: AssignTaskProps) {
  const [assignedTo, setAssignedTo] = useState("");
  const [drafts, setDrafts] = useState<TaskDraft[]>([]);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<TaskDraft, "id">>(emptyDraft);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<number | null>(null); // holds count assigned, for the message

  const assignableEmployees = (employees ?? []).filter((emp) => emp.role === "employee");

  const selectedEmployee = assignableEmployees.find((e) => e._id === assignedTo);
  const departmentTasks = getTasksForDepartment(selectedEmployee?.department);
  const workTypeValue = departmentTasks.includes(draft.workType) ? draft.workType : "";

  const isShootWork = SHOOT_WORK_TYPES.includes(draft.workType);
  const isEditCountWork = EDIT_COUNT_WORK_TYPES.includes(draft.workType);

  // Switching employee mid-batch invalidates any drafts — different
  // department means a different work-type list entirely.
  const handleAssignedToChange = (empId: string) => {
    setAssignedTo(empId);
    setDraft(emptyDraft);
    setEditingDraftId(null);
    setDrafts([]);
  };

  const handleWorkTypeChange = (wt: string) => {
    setDraft((prev) => ({
      ...prev,
      workType: wt,
      title: wt,
      location: SHOOT_WORK_TYPES.includes(wt) ? prev.location : "",
      time: SHOOT_WORK_TYPES.includes(wt) ? prev.time : "",
      mediaType: SHOOT_WORK_TYPES.includes(wt) ? prev.mediaType : "",
      totalCount: EDIT_COUNT_WORK_TYPES.includes(wt) ? prev.totalCount : "",
    }));
  };

  const draftValid = Boolean(draft.workType && draft.title && draft.brandId && draft.dueDate);

  // Push the current draft into the tab strip (or update it if re-editing),
  // then reset the composer so the next Task/Brand can be filled in.
  const handleAddDraft = () => {
    if (!draftValid) return;
    if (editingDraftId) {
      setDrafts((prev) => prev.map((d) => (d.id === editingDraftId ? { ...draft, id: editingDraftId } : d)));
    } else {
      setDrafts((prev) => [...prev, { ...draft, id: `${Date.now()}-${prev.length}` }]);
    }
    setDraft(emptyDraft);
    setEditingDraftId(null);
  };

  const openDraftTab = (d: TaskDraft) => {
    setDraft({ ...d });
    setEditingDraftId(d.id);
  };

  const removeDraftTab = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    if (editingDraftId === id) {
      setDraft(emptyDraft);
      setEditingDraftId(null);
    }
  };

  const handleSubmitBatch = () => {
    if (!assignedTo) return;

    // Include whatever's currently in the composer if it's valid but
    // hasn't explicitly been added as a tab yet, so nothing gets lost.
    const pending: TaskDraft[] =
      draftValid && !editingDraftId ? [...drafts, { ...draft, id: `pending-${Date.now()}` }] : drafts;

    if (pending.length === 0) return;

    setSubmitting(true);
    pending.forEach((d) => {
      const isShoot = SHOOT_WORK_TYPES.includes(d.workType);
      const isEditCount = EDIT_COUNT_WORK_TYPES.includes(d.workType);
      onAssign({
        title: d.title,
        description: d.description,
        assignedTo,
        brandId: d.brandId,
        frequency: d.frequency,
        dueDate: d.dueDate,
        department: selectedEmployee?.department,
        taskType: d.workType || undefined,
        location: isShoot ? d.location : undefined,
        time: isShoot ? d.time : undefined,
        mediaType: isShoot && d.mediaType ? d.mediaType : undefined,
        totalCount: isEditCount && d.totalCount ? d.totalCount : undefined,
      });
    });

    setSuccess(pending.length);
    setSubmitting(false);
    setDrafts([]);
    setDraft(emptyDraft);
    setEditingDraftId(null);
    setAssignedTo("");
    setTimeout(() => setSuccess(null), 3000);
  };

  const pendingCount = drafts.length + (draftValid && !editingDraftId ? 1 : 0);

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
          <h2 className={styles.title}>Assign New Task(s)</h2>
          <p className={styles.subtitle}>Pick an employee, then add one or more tasks to assign at once</p>
        </div>
      </div>

      {success !== null && (
        <div className={styles.successMsg}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {success} task{success === 1 ? "" : "s"} assigned successfully!
        </div>
      )}

      <div className={styles.form}>
        {/* ── Employee (picked once for the whole batch) ── */}
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Assign To *</label>
            <select
              className={styles.input}
              value={assignedTo}
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
        </div>

        {selectedEmployee && (
          <>
            {/* ── Drafted tasks tab strip ── */}
            {drafts.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
                {drafts.map((d, idx) => (
                  <div
                    key={d.id}
                    onClick={() => openDraftTab(d)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      background: editingDraftId === d.id ? "#eef2ff" : "#f1f5f9",
                      color: editingDraftId === d.id ? "#4338ca" : "#475569",
                      border: editingDraftId === d.id ? "1px solid #c7d2fe" : "1px solid transparent",
                    }}
                  >
                    <span>
                      {idx + 1}. {d.title || d.workType} —{" "}
                      {brands.find((b) => b._id === d.brandId)?.name ?? "Brand"}
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDraftTab(d.id);
                      }}
                      style={{ color: "#ef4444", fontWeight: 700 }}
                    >
                      ✕
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Work Type + Brand for the task currently being composed ── */}
            <div className={styles.row}>
              {departmentTasks.length > 0 && (
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
              )}

              {draft.workType && (
                <div className={styles.field}>
                  <label className={styles.label}>Brand *</label>
                  <select
                    className={styles.input}
                    value={draft.brandId}
                    onChange={(e) => setDraft({ ...draft, brandId: e.target.value })}
                  >
                    <option value="">Select Brand</option>
                    {brands.map((brand) => (
                      <option key={brand._id} value={brand._id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {draft.workType && draft.brandId && (
              <>
                {isShootWork && (
                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label className={styles.label}>Shoot Location</label>
                      <input
                        className={styles.input}
                        placeholder="e.g. Rishikesh Riverside Studio"
                        value={draft.location}
                        onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Shoot Time</label>
                      <input
                        className={styles.input}
                        placeholder="e.g. 10:30 AM"
                        value={draft.time}
                        onChange={(e) => setDraft({ ...draft, time: e.target.value })}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Media Type</label>
                      <select
                        className={styles.input}
                        value={draft.mediaType}
                        onChange={(e) =>
                          setDraft({ ...draft, mediaType: e.target.value as "" | "photo" | "video" | "both" })
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
                        value={draft.totalCount}
                        onChange={(e) => setDraft({ ...draft, totalCount: e.target.value })}
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
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Description {isShootWork ? "/ Notes" : ""}</label>
                  <textarea
                    className={`${styles.input} ${styles.textarea}`}
                    placeholder={isShootWork ? "Any notes for the shoot…" : "Describe the task in detail..."}
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Frequency *</label>
                    <div className={styles.freqToggle}>
                      <button
                        type="button"
                        className={`${styles.freqBtn} ${draft.frequency === "weekly" ? styles.freqActive : ""}`}
                        onClick={() => setDraft({ ...draft, frequency: "weekly" })}
                      >
                        📅 Weekly
                      </button>
                      <button
                        type="button"
                        className={`${styles.freqBtn} ${draft.frequency === "monthly" ? styles.freqActive : ""}`}
                        onClick={() => setDraft({ ...draft, frequency: "monthly" })}
                      >
                        🗓️ Monthly
                      </button>
                      <button
                        type="button"
                        className={`${styles.freqBtn} ${draft.frequency === "one_time" ? styles.freqActive : ""}`}
                        onClick={() => setDraft({ ...draft, frequency: "one_time" })}
                      >
                        ⏱️ One Time
                      </button>
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Due Date *</label>
                    <input
                      type="date"
                      className={styles.input}
                      value={draft.dueDate}
                      onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.submitBtn}
                  style={{ background: "#334155" }}
                  onClick={handleAddDraft}
                  disabled={!draftValid}
                >
                  {editingDraftId ? "Update Task in Batch" : "+ Add Task & Continue"}
                </button>
              </>
            )}
          </>
        )}

        <button className={styles.submitBtn} onClick={handleSubmitBatch} disabled={!assignedTo || submitting || pendingCount === 0}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          {submitting ? "Assigning..." : `Assign ${pendingCount} Task(s)`}
        </button>
      </div>
    </div>
  );
}