"use client";

import { useState, useMemo } from "react";
import api from "@/lib/api";
import { Task, Employee, TaskFrequency } from "@/types/admin/Crm";
import { getTasksForDepartment } from "@/data/superadmin/departmentTasks";
import styles from "@/public/assets/styles/dashboard/admindashboard/Admintasks.module.css";

interface AdminTasksProps {
  tasks: Task[];
  employees: Employee[];
  adminId: string;
  onRefresh: () => void;
}

type SubtaskRow = {
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  frequency: TaskFrequency;
};

const emptyRow = (): SubtaskRow => ({
  title: "",
  description: "",
  assignedTo: "",
  dueDate: "",
  frequency: "one_time",
});

const getId = (val: string | { _id: string } | null | undefined): string => {
  if (!val) return "";
  return typeof val === "object" ? val._id : val;
};

export default function AdminTasks({
  tasks,
  employees,
  adminId,
  onRefresh,
}: AdminTasksProps) {
  const [splitTarget, setSplitTarget] = useState<Task | null>(null);
  const [rows, setRows] = useState<SubtaskRow[]>([emptyRow()]);
  const [saving, setSaving] = useState(false);
  const [splitError, setSplitError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "in_progress" | "completed">("all");

  const onlyEmployees = useMemo(
    () => employees.filter((e) => e.role === "employee"),
    [employees]
  );

  // Top-level tasks the Super Admin assigned directly to THIS admin
  const myTasksFromSA = useMemo(
    () =>
      tasks.filter(
        (t) =>
          getId(t.assignedTo) === adminId &&
          t.assignedBy === "super_admin" &&
          !(t as unknown as { parentTaskId?: string | null }).parentTaskId
      ),
    [tasks, adminId]
  );

  const getSubtasks = (parentId: string) =>
    tasks.filter(
      (t) => (t as unknown as { parentTaskId?: string | null }).parentTaskId === parentId
    );

  const getEmpName = (id: string) =>
    onlyEmployees.find((e) => e._id === id)?.name ?? "Unknown";

  const filteredTasks = useMemo(() => {
    if (filter === "all") return myTasksFromSA;
    if (filter === "completed")
      return myTasksFromSA.filter((t) => t.status === "completed");
    if (filter === "pending")
      return myTasksFromSA.filter((t) => getSubtasks(t._id).length === 0);
    // in_progress = split but not all done
    return myTasksFromSA.filter((t) => {
      const subs = getSubtasks(t._id);
      return subs.length > 0 && t.status !== "completed";
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, myTasksFromSA, tasks]);

  const openSplit = (task: Task) => {
    setSplitTarget(task);
    setRows([emptyRow()]);
    setSplitError(null);
  };

  const updateRow = (i: number, field: keyof SubtaskRow, value: string) => {
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r))
    );
  };

  // When a row's employee changes, look up their department and clear the
  // row's title only if it no longer belongs to the new department's task
  // list — same guard used in AssignTask / SATasks so a stale title from a
  // different department can't slip through.
  const updateRowAssignee = (i: number, empId: string) => {
    const newEmp = onlyEmployees.find((e) => e._id === empId);
    const newDeptTasks = getTasksForDepartment(newEmp?.department);
    setRows((prev) =>
      prev.map((r, idx) =>
        idx === i
          ? {
              ...r,
              assignedTo: empId,
              title: newDeptTasks.includes(r.title) ? r.title : "",
            }
          : r
      )
    );
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (i: number) =>
    setRows((prev) => prev.filter((_, idx) => idx !== i));

  const submitSplit = async () => {
    if (!splitTarget) return;
    const valid = rows.filter((r) => r.title.trim() && r.assignedTo);
    if (valid.length === 0) {
      setSplitError("Add at least one sub-task with a title and an assigned employee.");
      return;
    }

    try {
      setSaving(true);
      setSplitError(null);
      await api.post(`/tasks/${splitTarget._id}/split`, { subtasks: valid });
      setSplitTarget(null);
      onRefresh();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setSplitError(axiosErr?.response?.data?.message ?? "Failed to split task. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = (s: string) =>
    s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Tasks from Super Admin</h2>
          <p className={styles.sub}>
            {myTasksFromSA.length} total &middot; assigned directly to you
          </p>
        </div>
        <div className={styles.filterWrap}>
          {(["all", "pending", "in_progress", "completed"] as const).map((f) => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : statusLabel(f)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Cards Grid ── */}
      {filteredTasks.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📭</div>
          <p>No tasks here yet.</p>
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {filteredTasks.map((task) => {
            const subs = getSubtasks(task._id);
            const doneCount = subs.filter((s) => s.status === "completed").length;
            const progressPct = subs.length > 0 ? Math.round((doneCount / subs.length) * 100) : 0;
            const isExpanded = expanded === task._id;

            return (
              <div key={task._id} className={styles.taskCard}>
                <div className={styles.cardTop}>
                  <span className={`${styles.statusBadge} ${styles[`status_${task.status}`]}`}>
                    {statusLabel(task.status)}
                  </span>
                  <span className={`${styles.freqBadge} ${styles[`freq_${task.frequency}`]}`}>
                    {task.frequency.replace("_", " ")}
                  </span>
                </div>

                <h3 className={styles.cardTitle}>{task.title}</h3>
                {task.description && (
                  <p className={styles.cardDesc}>{task.description}</p>
                )}

                <div className={styles.cardMeta}>
                  <span className={styles.metaItem}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Due: {task.dueDate || "—"}
                  </span>
                </div>

                {/* Progress bar */}
                {subs.length > 0 && (
                  <div className={styles.progressWrap}>
                    <div className={styles.progressBarBg}>
                      <div
                        className={styles.progressBarFill}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className={styles.progressText}>
                      {doneCount}/{subs.length} sub-tasks done
                    </span>
                  </div>
                )}

                <div className={styles.cardActions}>
                  {subs.length > 0 && (
                    <button
                      className={styles.viewSubBtn}
                      onClick={() => setExpanded(isExpanded ? null : task._id)}
                    >
                      {isExpanded ? "Hide" : "View"} Sub-tasks {isExpanded ? "▲" : "▼"}
                    </button>
                  )}
                  <button className={styles.splitBtn} onClick={() => openSplit(task)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    {subs.length > 0 ? "Add More" : "Split & Assign"}
                  </button>
                </div>

                {isExpanded && (
                  <div className={styles.subList}>
                    {subs.map((s) => (
                      <div key={s._id} className={styles.subItem}>
                        <div className={styles.subLeft}>
                          <div className={styles.subAvatar}>
                            {getEmpName(getId(s.assignedTo))[0] ?? "?"}
                          </div>
                          <div>
                            <div className={styles.subTitle}>{s.title}</div>
                            <div className={styles.subEmp}>{getEmpName(getId(s.assignedTo))}</div>
                          </div>
                        </div>
                        <span className={`${styles.statusBadge} ${styles[`status_${s.status}`]}`}>
                          {statusLabel(s.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Split Modal ── */}
      {splitTarget && (
        <div className={styles.overlay} onClick={() => setSplitTarget(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Split Task</h3>
                <p className={styles.modalSub}>{splitTarget.title}</p>
              </div>
              <button className={styles.modalClose} onClick={() => setSplitTarget(null)}>
                ✕
              </button>
            </div>

            {splitError && <p className={styles.formError}>⚠️ {splitError}</p>}

            <div className={styles.rowsWrap}>
              {rows.map((row, i) => {
                const rowEmp = onlyEmployees.find((e) => e._id === row.assignedTo);
                const rowDeptTasks = getTasksForDepartment(rowEmp?.department);
                const rowWorkTypeValue = rowDeptTasks.includes(row.title) ? row.title : "";

                return (
                  <div key={i} className={styles.subtaskRow}>
                    <div className={styles.rowHeader}>
                      <span className={styles.rowIndex}>Sub-task #{i + 1}</span>
                      {rows.length > 1 && (
                        <button className={styles.removeRowBtn} onClick={() => removeRow(i)}>
                          Remove
                        </button>
                      )}
                    </div>
                    <div className={styles.rowGrid}>
                      <div className={styles.field}>
                        <label>Assign To *</label>
                        <select
                          className={styles.input}
                          value={row.assignedTo}
                          onChange={(e) => updateRowAssignee(i, e.target.value)}
                        >
                          <option value="">Select Employee</option>
                          {onlyEmployees.map((e) => (
                            <option key={e._id} value={e._id}>
                              {e.name} — {e.department}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Department — auto-filled, read-only, only shown once an employee is picked */}
                      {rowEmp && (
                        <div className={styles.field}>
                          <label>Department</label>
                          <input className={styles.input} value={rowEmp.department} disabled readOnly />
                        </div>
                      )}

                      {/* Work Type — department-specific dropdown; selecting
                          an option fills this row's Title below. */}
                      {rowEmp && rowDeptTasks.length > 0 && (
                        <div className={styles.field}>
                          <label>Work Type *</label>
                          <select
                            className={styles.input}
                            value={rowWorkTypeValue}
                            onChange={(e) => updateRow(i, "title", e.target.value)}
                          >
                            <option value="">Select work type</option>
                            {rowDeptTasks.map((wt) => (
                              <option key={wt} value={wt}>
                                {wt}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className={styles.field}>
                        <label>Title *</label>
                        <input
                          className={styles.input}
                          placeholder="e.g. Design Instagram Post"
                          value={row.title}
                          onChange={(e) => updateRow(i, "title", e.target.value)}
                        />
                      </div>
                      <div className={styles.field}>
                        <label>Due Date</label>
                        <input
                          type="date"
                          className={styles.input}
                          value={row.dueDate}
                          onChange={(e) => updateRow(i, "dueDate", e.target.value)}
                        />
                      </div>
                      <div className={styles.field}>
                        <label>Frequency</label>
                        <select
                          className={styles.input}
                          value={row.frequency}
                          onChange={(e) =>
                            updateRow(i, "frequency", e.target.value as TaskFrequency)
                          }
                        >
                          <option value="one_time">One Time</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      <div className={`${styles.field} ${styles.fullSpan}`}>
                        <label>Description</label>
                        <textarea
                          className={`${styles.input} ${styles.textarea}`}
                          placeholder="Describe this sub-task…"
                          rows={2}
                          value={row.description}
                          onChange={(e) => updateRow(i, "description", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button className={styles.addRowBtn} onClick={addRow}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Another Sub-task
            </button>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setSplitTarget(null)}>
                Cancel
              </button>
              <button className={styles.saveBtn} onClick={submitSplit} disabled={saving}>
                {saving ? "Assigning..." : "Assign Sub-tasks"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}