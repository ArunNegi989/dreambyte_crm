"use client";

import { useState } from "react";
import { Task, Employee, Brand, TaskStatus, TaskFrequency } from "@/types/superadmin/superAdmin";
import styles from "@/public/assets/styles/dashboard/super-admin-dashboard/Satasks.module.css";

interface SATasksProps {
  tasks: Task[];
  employees: Employee[];
  brands: Brand[];
  onStatusChange: (id: string, status: TaskStatus, remark?: string) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (t: Omit<Task, "id" | "createdAt">) => void;
  onEditTask: (t: Task) => void;
  onAddChange: (id: string, note: string) => void;
}

const emptyTaskForm = {
  title: "", description: "", assignedTo: "", brandId: "",
  frequency: "weekly" as TaskFrequency, dueDate: "",
};

export default function SATasks({
  tasks, employees, brands, onStatusChange, onDeleteTask, onAddTask, onEditTask, onAddChange,
}: SATasksProps) {
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyTaskForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [changeNotes, setChangeNotes] = useState<Record<string, string>>({});
  const [rejectRemark, setRejectRemark] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");

  const getEmpName = (id: string) => employees.find((e) => e.id === id)?.name ?? "—";
  const getBrandName = (id?: string) => brands.find((b) => b.id === id)?.name ?? "—";

  const openAdd = () => { setEditTarget(null); setForm(emptyTaskForm); setShowForm(true); };
  const openEdit = (t: Task) => {
    setEditTarget(t);
    setForm({ title: t.title, description: t.description, assignedTo: t.assignedTo, brandId: t.brandId ?? "", frequency: t.frequency, dueDate: t.dueDate });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.title || !form.assignedTo) return;
    if (editTarget) {
      onEditTask({ ...editTarget, ...form, brandId: form.brandId || undefined });
    } else {
      onAddTask({ ...form, assignedBy: "super_admin", brandId: form.brandId || undefined, status: "pending", deliveryStatus: "not_delivered", changes: [] });
    }
    setShowForm(false);
  };

  const filteredTasks = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const statusColors: Record<TaskStatus, string> = {
    completed: styles.sCompleted,
    pending: styles.sPending,
    rejected: styles.sRejected,
    approved: styles.sApproved,
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Tasks</h2>
          <p className={styles.sub}>{tasks.length} total tasks</p>
        </div>
        <div className={styles.headerRight}>
          {/* Filter */}
          <div className={styles.filterWrap}>
            {(["all", "pending", "completed", "rejected"] as const).map((f) => (
              <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ""}`} onClick={() => setFilter(f)}>
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button className={styles.addBtn} onClick={openAdd}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Assign Task
          </button>
        </div>
      </div>

      {/* Assign / Edit Form */}
      {showForm && (
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h3 className={styles.formTitle}>{editTarget ? "Edit Task" : "Assign New Task"}</h3>
            <button className={styles.formClose} onClick={() => setShowForm(false)}>✕</button>
          </div>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Task Title *</label>
              <input className={styles.input} placeholder="e.g. Build Login Page" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className={styles.field}>
              <label>Assign To *</label>
              <select className={styles.input} value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">Select Employee</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Brand</label>
              <select className={styles.input} value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })}>
                <option value="">No Brand</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Frequency</label>
              <select className={styles.input} value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as TaskFrequency })}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="one_time">One Time</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Due Date</label>
              <input type="date" className={styles.input} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div className={`${styles.field} ${styles.fullSpan}`}>
              <label>Description</label>
              <textarea className={`${styles.input} ${styles.textarea}`} placeholder="Describe the task…" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
            <button className={styles.saveBtn} onClick={handleSubmit}>{editTarget ? "Save Changes" : "Assign Task"}</button>
          </div>
        </div>
      )}

      {/* Task Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Task</th>
              <th>Assigned To</th>
              <th>Brand</th>
              <th>By</th>
              <th>Freq</th>
              <th>Due</th>
              <th>Delivery</th>
              <th>Changes</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => {
              const isExpanded = expandedId === task.id;
              return (
                <>
                  <tr key={task.id} className={styles.taskRow}>
                    <td>
                      <div className={styles.taskCell}>
                        <span className={styles.taskName}>{task.title}</span>
                        <span className={styles.taskDesc}>{task.description}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.empMini}>
                        <div className={styles.empAvatar}>{getEmpName(task.assignedTo)[0]}</div>
                        <span>{getEmpName(task.assignedTo)}</span>
                      </div>
                    </td>
                    <td><span className={styles.brandPill}>{getBrandName(task.brandId)}</span></td>
                    <td><span className={`${styles.byPill} ${task.assignedBy === "super_admin" ? styles.bySA : styles.byAdmin}`}>{task.assignedBy === "super_admin" ? "S.Admin" : "Admin"}</span></td>
                    <td><span className={`${styles.freqPill} ${styles[`freq_${task.frequency}`]}`}>{task.frequency}</span></td>
                    <td><span className={styles.dueDate}>{task.dueDate}</span></td>
                    <td>
                      <span className={`${styles.delivPill} ${task.deliveryStatus === "delivered" ? styles.delivered : styles.notDelivered}`}>
                        {task.deliveryStatus === "delivered" ? "✓" : "✗"} {task.deliveryStatus === "delivered" ? "Delivered" : "Not Delivered"}
                      </span>
                    </td>
                    <td>
                      <button className={`${styles.changeToggle} ${task.changes.length > 0 ? styles.hasCh : ""}`} onClick={() => setExpandedId(isExpanded ? null : task.id)}>
                        {task.changes.length > 0 && <span className={styles.chBubble}>{task.changes.length}</span>}
                        ✏️ {isExpanded ? "▲" : "▼"}
                      </button>
                    </td>
                    <td>
                      <div className={styles.statusRadios}>
                        {(["pending", "approved", "completed", "rejected"] as TaskStatus[]).map((s) => (
                          <label key={s} className={`${styles.sLabel} ${task.status === s ? styles[`sActive_${s}`] : ""}`}>
                            <input type="radio" name={`s-${task.id}`} value={s} checked={task.status === s}
                              onChange={() => onStatusChange(task.id, s, s === "rejected" ? rejectRemark[task.id] : undefined)}
                              className={styles.sRadio} />
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </label>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionBtns}>
                        <button className={styles.editBtn} onClick={() => openEdit(task)} title="Edit task">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        {deleteConfirm === task.id ? (
                          <div className={styles.confirmRow}>
                            <button className={styles.cYes} onClick={() => { onDeleteTask(task.id); setDeleteConfirm(null); }}>✓</button>
                            <button className={styles.cNo} onClick={() => setDeleteConfirm(null)}>✕</button>
                          </div>
                        ) : (
                          <button className={styles.delBtn} onClick={() => setDeleteConfirm(task.id)} title="Delete task">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Reject remark row */}
                  {task.status === "rejected" && (
                    <tr key={`${task.id}-remark`} className={styles.remarkRow}>
                      <td colSpan={10}>
                        <div className={styles.remarkBox}>
                          <span className={styles.remarkLabel}>Reject Remark:</span>
                          <input
                            className={styles.remarkInput}
                            placeholder="Enter reason for rejection…"
                            value={rejectRemark[task.id] ?? task.rejectRemark ?? ""}
                            onChange={(e) => setRejectRemark((prev) => ({ ...prev, [task.id]: e.target.value }))}
                          />
                          <button className={styles.remarkSave} onClick={() => onStatusChange(task.id, "rejected", rejectRemark[task.id])}>
                            Save Remark
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Change log dropdown */}
                  {isExpanded && (
                    <tr key={`${task.id}-changes`} className={styles.changeRow}>
                      <td colSpan={10}>
                        <div className={styles.changeDropdown}>
                          <div className={styles.changeHeader}>Change Log — <strong>{task.title}</strong></div>
                          {task.changes.length === 0 ? (
                            <p className={styles.noCh}>No changes recorded yet.</p>
                          ) : (
                            <div className={styles.chList}>
                              {task.changes.map((ch) => (
                                <div key={ch.id} className={styles.chItem}>
                                  <div className={styles.chTop}>
                                    <span className={styles.chBy}>{ch.changedBy}</span>
                                    <span className={styles.chDate}>{ch.changedAt}</span>
                                  </div>
                                  <p className={styles.chNote}>{ch.note}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className={styles.addCh}>
                            <textarea className={styles.chInput} rows={2} placeholder="Describe the change…"
                              value={changeNotes[task.id] ?? ""}
                              onChange={(e) => setChangeNotes((p) => ({ ...p, [task.id]: e.target.value }))} />
                            <button className={styles.addChBtn} onClick={() => { if (changeNotes[task.id]?.trim()) { onAddChange(task.id, changeNotes[task.id]); setChangeNotes((p) => ({ ...p, [task.id]: "" })); } }}>
                              Add Note
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {filteredTasks.length === 0 && (
              <tr><td colSpan={10} className={styles.empty}>No tasks found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}