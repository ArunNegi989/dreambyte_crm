"use client";

import { useState } from "react";
import api from "@/lib/api";
import { Task, Employee, Brand, TaskStatus, TaskFrequency } from "@/types/superadmin/superAdmin";
import styles from "@/public/assets/styles/dashboard/super-admin-dashboard/Satasks.module.css";

interface SATasksProps {
  tasks: Task[];
  employees: Employee[];
  brands: Brand[];
  viewerRole?: "super_admin" | "admin" | "employee"; // controls what actions are shown
  viewerId?: string; // Employee _id — for employee: only show their tasks
  onStatusChange: (id: string, status: TaskStatus, remark?: string) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (t: Omit<Task, "_id" | "createdAt" | "updatedAt">) => void;
  onEditTask: (t: Task) => void;
  onAddChange: (id: string, note: string) => void;
  onDeliverTask: (id: string, note: string) => void;
}

const emptyTaskForm = {
  title: "",
  description: "",
  assignedTo: "",
  brandId: "",
  frequency: "weekly" as TaskFrequency,
  dueDate: "",
};

export default function SATasks({
  tasks,
  employees,
  brands,
  viewerRole = "super_admin",
  viewerId,
  onStatusChange,
  onDeleteTask,
  onAddTask,
  onEditTask,
  onAddChange,
  onDeliverTask,
}: SATasksProps) {
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyTaskForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [changeNotes, setChangeNotes] = useState<Record<string, string>>({});
  const [rejectRemark, setRejectRemark] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");

  // Deliver modal state
  const [deliverModal, setDeliverModal] = useState<Task | null>(null);
  const [deliverNote, setDeliverNote] = useState("");
  const [delivering, setDelivering] = useState(false);

  const isAdminOrSA = viewerRole === "super_admin" || viewerRole === "admin";

  // Employee sees only their tasks
  const visibleTasks =
    viewerRole === "employee" && viewerId
      ? tasks.filter((t) => {
          const id = typeof t.assignedTo === "object"
            ? (t.assignedTo as { _id: string })._id
            : t.assignedTo;
          return id === viewerId;
        })
      : tasks;

  const filteredTasks =
    filter === "all"
      ? visibleTasks
      : visibleTasks.filter((t) => t.status === filter);

  const getEmpName = (assignedTo: string | { _id: string; name: string }) => {
    if (typeof assignedTo === "object") return assignedTo.name;
    return employees.find((e) => e._id === assignedTo)?.name ?? "—";
  };

  const getBrandName = (brandId?: string | { _id: string; name: string } | null) => {
    if (!brandId) return "—";
    if (typeof brandId === "object") return brandId.name;
    return brands.find((b) => b._id === brandId)?.name ?? "—";
  };

  const getTaskId = (t: Task) => t._id;

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyTaskForm);
    setShowForm(true);
  };

  const openEdit = (t: Task) => {
    setEditTarget(t);
    setForm({
      title: t.title,
      description: t.description,
      assignedTo: typeof t.assignedTo === "object" ? (t.assignedTo as { _id: string })._id : t.assignedTo,
      brandId: t.brandId
        ? typeof t.brandId === "object"
          ? (t.brandId as { _id: string })._id
          : t.brandId
        : "",
      frequency: t.frequency,
      dueDate: t.dueDate,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.title || !form.assignedTo) return;
    if (editTarget) {
      onEditTask({
        ...editTarget,
        ...form,
        brandId: form.brandId || undefined,
      });
    } else {
      onAddTask({
        ...form,
        assignedBy: viewerRole === "admin" ? "admin" : "super_admin",
        brandId: form.brandId || undefined,
        status: "pending",
        deliveryStatus: "not_delivered",
        deliveryNote: "",
        deliveredAt: undefined,
        rejectRemark: "",
        changes: [],
      });
    }
    setShowForm(false);
  };

  const handleDeliver = async () => {
    if (!deliverModal) return;
    try {
      setDelivering(true);
      await api.post(`/tasks/${deliverModal._id}/deliver`, { deliveryNote: deliverNote });
      onDeliverTask(deliverModal._id, deliverNote);
      setDeliverModal(null);
      setDeliverNote("");
    } catch (err) {
      console.error("Delivery failed", err);
    } finally {
      setDelivering(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Tasks</h2>
          <p className={styles.sub}>{visibleTasks.length} total tasks</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.filterWrap}>
            {(["all", "pending", "approved", "completed", "rejected"] as const).map((f) => (
              <button
                key={f}
                className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {isAdminOrSA && (
            <button className={styles.addBtn} onClick={openAdd}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Assign Task
            </button>
          )}
        </div>
      </div>

      {/* ── Assign / Edit Form ── */}
      {showForm && isAdminOrSA && (
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h3 className={styles.formTitle}>{editTarget ? "Edit Task" : "Assign New Task"}</h3>
            <button className={styles.formClose} onClick={() => setShowForm(false)}>✕</button>
          </div>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Task Title *</label>
              <input
                className={styles.input}
                placeholder="e.g. Build Login Page"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>Assign To *</label>
              <select
                className={styles.input}
                value={form.assignedTo}
                onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              >
                <option value="">Select Employee</option>
                {employees.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.name} — {e.role}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label>Brand</label>
              <select
                className={styles.input}
                value={form.brandId}
                onChange={(e) => setForm({ ...form, brandId: e.target.value })}
              >
                <option value="">No Brand</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label>Frequency</label>
              <select
                className={styles.input}
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value as TaskFrequency })}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="one_time">One Time</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Due Date</label>
              <input
                type="date"
                className={styles.input}
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div className={`${styles.field} ${styles.fullSpan}`}>
              <label>Description</label>
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                placeholder="Describe the task…"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
            <button className={styles.saveBtn} onClick={handleSubmit}>
              {editTarget ? "Save Changes" : "Assign Task"}
            </button>
          </div>
        </div>
      )}

      {/* ── Task Table ── */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Task</th>
              <th>Assigned To</th>
              <th>Brand</th>
              {isAdminOrSA && <th>By</th>}
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
              const tid = getTaskId(task);
              const isExpanded = expandedId === tid;

              return (
                <tr key={tid} className={styles.taskRow}>
                  {/* Task name */}
                  <td>
                    <div className={styles.taskCell}>
                      <span className={styles.taskName}>{task.title}</span>
                      <span className={styles.taskDesc}>{task.description}</span>
                    </div>
                  </td>

                  {/* Assigned To */}
                  <td>
                    <div className={styles.empMini}>
                      <div className={styles.empAvatar}>{getEmpName(task.assignedTo)[0]}</div>
                      <span>{getEmpName(task.assignedTo)}</span>
                    </div>
                  </td>

                  {/* Brand */}
                  <td>
                    <span className={styles.brandPill}>{getBrandName(task.brandId ?? undefined)}</span>
                  </td>

                  {/* Assigned By — only for admin/SA */}
                  {isAdminOrSA && (
                    <td>
                      <span className={`${styles.byPill} ${task.assignedBy === "super_admin" ? styles.bySA : styles.byAdmin}`}>
                        {task.assignedBy === "super_admin" ? "S.Admin" : "Admin"}
                      </span>
                    </td>
                  )}

                  {/* Frequency */}
                  <td>
                    <span className={`${styles.freqPill} ${styles[`freq_${task.frequency}`]}`}>
                      {task.frequency}
                    </span>
                  </td>

                  {/* Due Date */}
                  <td><span className={styles.dueDate}>{task.dueDate || "—"}</span></td>

                  {/* Delivery */}
                  <td>
                    {task.deliveryStatus === "delivered" ? (
                      <div className={styles.deliveredCell}>
                        <span className={`${styles.delivPill} ${styles.delivered}`}>
                          ✓ Delivered
                        </span>
                        {task.deliveryNote && (
                          <span className={styles.delivNote}>{task.deliveryNote}</span>
                        )}
                        {task.deliveredAt && (
                          <span className={styles.delivDate}>{task.deliveredAt}</span>
                        )}
                      </div>
                    ) : viewerRole === "employee" ? (
                      <button
                        className={styles.deliverBtn}
                        onClick={() => { setDeliverModal(task); setDeliverNote(""); }}
                      >
                        Mark Delivered
                      </button>
                    ) : (
                      <span className={`${styles.delivPill} ${styles.notDelivered}`}>
                        ✗ Not Delivered
                      </span>
                    )}
                  </td>

                  {/* Changes toggle */}
                  <td>
                    <button
                      className={`${styles.changeToggle} ${task.changes.length > 0 ? styles.hasCh : ""}`}
                      onClick={() => setExpandedId(isExpanded ? null : tid)}
                    >
                      {task.changes.length > 0 && (
                        <span className={styles.chBubble}>{task.changes.length}</span>
                      )}
                      ✏️ {isExpanded ? "▲" : "▼"}
                    </button>
                  </td>

                  {/* Status — admin/SA can change, employee sees badge */}
                  <td>
                    {isAdminOrSA ? (
                      <div className={styles.statusRadios}>
                        {(["pending", "approved", "completed", "rejected"] as TaskStatus[]).map((s) => (
                          <label
                            key={s}
                            className={`${styles.sLabel} ${task.status === s ? styles[`sActive_${s}`] : ""}`}
                          >
                            <input
                              type="radio"
                              name={`s-${tid}`}
                              value={s}
                              checked={task.status === s}
                              onChange={() =>
                                onStatusChange(
                                  tid,
                                  s,
                                  s === "rejected" ? rejectRemark[tid] : undefined
                                )
                              }
                              className={styles.sRadio}
                            />
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <span className={`${styles.sLabel} ${styles[`sActive_${task.status}`]}`}>
                        {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td>
                    <div className={styles.actionBtns}>
                      {isAdminOrSA && (
                        <>
                          <button className={styles.editBtn} onClick={() => openEdit(task)} title="Edit task">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          {deleteConfirm === tid ? (
                            <div className={styles.confirmRow}>
                              <button className={styles.cYes} onClick={() => { onDeleteTask(tid); setDeleteConfirm(null); }}>✓</button>
                              <button className={styles.cNo} onClick={() => setDeleteConfirm(null)}>✕</button>
                            </div>
                          ) : (
                            <button className={styles.delBtn} onClick={() => setDeleteConfirm(tid)} title="Delete task">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14H6L5 6" />
                                <path d="M10 11v6" /><path d="M14 11v6" />
                                <path d="M9 6V4h6v2" />
                              </svg>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Reject remark rows */}
            {isAdminOrSA &&
              filteredTasks
                .filter((t) => t.status === "rejected")
                .map((task) => {
                  const tid = getTaskId(task);
                  return (
                    <tr key={`${tid}-remark`} className={styles.remarkRow}>
                      <td colSpan={10}>
                        <div className={styles.remarkBox}>
                          <span className={styles.remarkLabel}>Reject Remark:</span>
                          <input
                            className={styles.remarkInput}
                            placeholder="Enter reason for rejection…"
                            value={rejectRemark[tid] ?? task.rejectRemark ?? ""}
                            onChange={(e) =>
                              setRejectRemark((prev) => ({ ...prev, [tid]: e.target.value }))
                            }
                          />
                          <button
                            className={styles.remarkSave}
                            onClick={() => onStatusChange(tid, "rejected", rejectRemark[tid])}
                          >
                            Save Remark
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

            {/* Change log rows */}
            {filteredTasks
              .filter((t) => expandedId === getTaskId(t))
              .map((task) => {
                const tid = getTaskId(task);
                return (
                  <tr key={`${tid}-changes`} className={styles.changeRow}>
                    <td colSpan={10}>
                      <div className={styles.changeDropdown}>
                        <div className={styles.changeHeader}>
                          Change Log — <strong>{task.title}</strong>
                        </div>
                        {task.changes.length === 0 ? (
                          <p className={styles.noCh}>No changes recorded yet.</p>
                        ) : (
                          <div className={styles.chList}>
                            {task.changes.map((ch) => (
                              <div key={ch._id} className={styles.chItem}>
                                <div className={styles.chTop}>
                                  <span className={styles.chBy}>{ch.changedBy}</span>
                                  <span className={styles.chDate}>{ch.changedAt}</span>
                                </div>
                                <p className={styles.chNote}>{ch.note}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {isAdminOrSA && (
                          <div className={styles.addCh}>
                            <textarea
                              className={styles.chInput}
                              rows={2}
                              placeholder="Describe the change…"
                              value={changeNotes[tid] ?? ""}
                              onChange={(e) =>
                                setChangeNotes((p) => ({ ...p, [tid]: e.target.value }))
                              }
                            />
                            <button
                              className={styles.addChBtn}
                              onClick={() => {
                                if (changeNotes[tid]?.trim()) {
                                  onAddChange(tid, changeNotes[tid]);
                                  setChangeNotes((p) => ({ ...p, [tid]: "" }));
                                }
                              }}
                            >
                              Add Note
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={10} className={styles.empty}>
                  No tasks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Deliver Modal (Employee) ── */}
      {deliverModal && (
        <div className={styles.deliverOverlay} onClick={() => setDeliverModal(null)}>
          <div className={styles.deliverModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.deliverClose} onClick={() => setDeliverModal(null)}>✕</button>
            <div className={styles.deliverHeader}>
              <div className={styles.deliverIcon}>✅</div>
              <h3 className={styles.deliverTitle}>Mark Task as Delivered</h3>
              <p className={styles.deliverSub}>{deliverModal.title}</p>
            </div>
            <div className={styles.deliverField}>
              <label>Delivery Note (optional)</label>
              <textarea
                className={styles.deliverInput}
                rows={4}
                placeholder="Describe what was delivered, any links, notes…"
                value={deliverNote}
                onChange={(e) => setDeliverNote(e.target.value)}
              />
            </div>
            <div className={styles.deliverActions}>
              <button className={styles.cancelBtn} onClick={() => setDeliverModal(null)}>
                Cancel
              </button>
              <button
                className={styles.deliverConfirmBtn}
                onClick={handleDeliver}
                disabled={delivering}
              >
                {delivering ? "Submitting..." : "Confirm Delivery"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}