"use client";

import { useState } from "react";
import { Task, Employee, TaskStatus } from "@/types/admin/Crm";
import styles from "@/public/assets/styles/dashboard/admindashboard/Tasktable.module.css";

interface TaskTableProps {
  tasks: Task[];
  employees: Employee[];
  onStatusChange: (
    taskId: string,
    status: TaskStatus,
    remark?: string,
    changedBy?: string
  ) => void;
}


const getTimeTakenLabel = (
  timeSpentMs?: number | null,
  currentSessionStartedAt?: string | null
): string => {
  let totalMs = timeSpentMs || 0;

  if (currentSessionStartedAt) {
    const elapsed = Date.now() - new Date(currentSessionStartedAt).getTime();
    if (elapsed > 0) totalMs += elapsed;
  }

  if (totalMs <= 0) return "—";

  const mins = Math.floor(totalMs / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  if (days > 0) return `${days}d ${hrs % 24}h`;
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  return `${mins}m`;
};

export default function TaskTable({
  tasks,
  employees,
  onStatusChange,
}: TaskTableProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [rejectRemark, setRejectRemark] = useState<Record<string, string>>({});
  const [remarkOpen, setRemarkOpen] = useState<Record<string, boolean>>({});

  const actorLabel = "Admin";
  const TOTAL_COLS = 9; // Task, Assigned To, By, Frequency, Due, Delivery, Time Taken, Changes, Review

  // Handles both populated object and plain string _id
  const getEmployeeName = (assignedTo: Task["assignedTo"]): string => {
    if (typeof assignedTo === "object" && assignedTo !== null) {
      return assignedTo.name;
    }
    return employees.find((e) => e._id === assignedTo)?.name ?? "Unassigned";
  };

  const getEmployeeInitial = (assignedTo: Task["assignedTo"]): string => {
    return getEmployeeName(assignedTo)?.[0] ?? "?";
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  // ── Status radio change handler ──────────────────────────────────────────
  // "rejected": opens a fresh, empty remark box (saved separately via the
  // remark row below). Any other status clears local rejection drafts.
  const handleStatusChange = (taskId: string, s: TaskStatus) => {
    onStatusChange(taskId, s, s === "rejected" ? "" : undefined, s === "rejected" ? actorLabel : undefined);

    if (s === "rejected") {
      setRejectRemark((prev) => ({ ...prev, [taskId]: "" }));
      setRemarkOpen((prev) => ({ ...prev, [taskId]: true }));
    } else {
      setRejectRemark((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      setRemarkOpen((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
    }
  };

  const saveRemark = (taskId: string) => {
    const text = rejectRemark[taskId] ?? "";
    if (!text.trim()) return;
    onStatusChange(taskId, "rejected", text, actorLabel);
    setRejectRemark((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
    setRemarkOpen((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.tableHeader}>
        <h2 className={styles.title}>Task Management</h2>
        <span className={styles.count}>{tasks.length} tasks</span>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Task</th>
              <th>Assigned To</th>
              <th>By</th>
              <th>Frequency</th>
              <th>Due Date</th>
              <th>Delivery</th>
              <th>Time Taken</th>
              <th>Changes</th>
              <th>Review</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const isExpanded = expandedTask === task._id;
              const hasChanges = task.changes.length > 0;

              // ── Extra fields (totalCount/completedCount, startedAt,
              // timeSpentMs, currentSessionStartedAt, subtasks) — same
              // shape as Super Admin's Task, just not in the shared admin
              // Task type yet, so cast here the same way SATasks does. ──
              const taskAny = task as unknown as {
                totalCount?: number | null;
                completedCount?: number;
                startedAt?: string | null;
                timeSpentMs?: number;
                currentSessionStartedAt?: string | null;
                subtasks?: { _id: string; title: string; status: "pending" | "completed" }[];
              };
              const subtaskCount = taskAny.subtasks?.length ?? 0;
              const subtaskDone = taskAny.subtasks?.filter((s) => s.status === "completed").length ?? 0;

              return (
                <>
                  <tr key={task._id} className={styles.taskRow}>
                    {/* Task Name */}
                    <td>
                      <div className={styles.taskCell}>
                        <span className={styles.taskName}>{task.title}</span>
                        <span className={styles.taskDesc}>
                          {task.description}
                          {taskAny.totalCount != null && (
                            <>
                              {" "}
                              &middot; {taskAny.completedCount ?? 0}/{taskAny.totalCount} edited
                            </>
                          )}
                          {subtaskCount > 0 && (
                            <>
                              {" "}
                              &middot; {subtaskDone}/{subtaskCount} subtasks
                            </>
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Employee */}
                    <td>
                      <div className={styles.empMini}>
                        <div className={styles.empAvatar}>
                          {getEmployeeInitial(task.assignedTo)}
                        </div>
                        <span className={styles.empName}>
                          {getEmployeeName(task.assignedTo)}
                        </span>
                      </div>
                    </td>

                    {/* Assigned By — same S.Admin / Admin pill as Super Admin's table */}
                    <td>
                      <span
                        className={`${styles.byPill ?? ""} ${
                          task.assignedBy === "super_admin" ? styles.bySA ?? "" : styles.byAdmin ?? ""
                        }`}
                        style={
                          !styles.byPill
                            ? {
                                fontSize: 11,
                                fontWeight: 600,
                                padding: "3px 8px",
                                borderRadius: 999,
                                background: task.assignedBy === "super_admin" ? "#ede9fe" : "#dbeafe",
                                color: task.assignedBy === "super_admin" ? "#6d28d9" : "#1d4ed8",
                                whiteSpace: "nowrap",
                              }
                            : undefined
                        }
                      >
                        {task.assignedBy === "super_admin" ? "S.Admin" : "Admin"}
                      </span>
                    </td>

                    {/* Frequency */}
                    <td>
                      <span className={`${styles.freqBadge} ${task.frequency === "weekly" ? styles.weekly : styles.monthly}`}>
                        {task.frequency}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td>
                      <span className={styles.dueDate}>{task.dueDate || "—"}</span>
                    </td>

                    {/* Delivery Status */}
                    <td>
                      <div>
                        {task.status === "rejected" ? (
                          <span className={`${styles.deliveryBadge} ${styles.notDelivered}`}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                            Rejected
                          </span>
                        ) : (
                          <span className={`${styles.deliveryBadge} ${task.deliveryStatus === "delivered" ? styles.delivered : styles.notDelivered}`}>
                            {task.deliveryStatus === "delivered" ? (
                              <>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Delivered
                              </>
                            ) : (
                              <>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                                Not Delivered
                              </>
                            )}
                          </span>
                        )}
                        {/* Delivery note if present */}
                        {task.status !== "rejected" && task.deliveryNote && (
                          <div className={styles.deliveryNote}>{task.deliveryNote}</div>
                        )}
                      </div>
                    </td>

                    {/* Time Taken — pause-aware accumulated time. Reads the
                        same timeSpentMs + currentSessionStartedAt fields the
                        employee's own dashboard uses, so both sides always
                        agree, including through reject -> resume cycles
                        (see getTimeTakenLabel's comment above). */}
                    <td>
                      <span
                        style={{
                          fontSize: 12,
                          color: taskAny.startedAt ? "#334155" : "#94a3b8",
                          whiteSpace: "nowrap",
                        }}
                        title={
                          taskAny.startedAt
                            ? `Started: ${new Date(taskAny.startedAt).toLocaleString("en-IN")}`
                            : "Not started yet"
                        }
                      >
                        {getTimeTakenLabel(taskAny.timeSpentMs, taskAny.currentSessionStartedAt)}
                        {taskAny.currentSessionStartedAt && (
                          <span style={{ color: "#2563eb" }}> ●</span>
                        )}
                      </span>
                    </td>

                    {/* Changes toggle */}
                    <td>
                      <button
                        className={`${styles.changeToggle} ${hasChanges || subtaskCount > 0 ? styles.hasChanges : ""}`}
                        onClick={() => toggleExpand(task._id)}
                        title="View Change Log"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        {task.changes.length > 0 && (
                          <span className={styles.changeBubble}>{task.changes.length}</span>
                        )}
                        {isExpanded ? "▲" : "▼"}
                      </button>
                    </td>

                    {/* Review */}
                    <td>
                      <div className={styles.reviewCell}>
                        {(["approved", "completed", "rejected", "pending"] as TaskStatus[]).map((s) => (
                          <label
                            key={s}
                            className={`${styles.radioLabel} ${
                              task.status === s
                                ? s === "approved"
                                  ? styles.activeApprove
                                  : s === "rejected"
                                  ? styles.activeReject
                                  : s === "completed"
                                  ? styles.activeApprove
                                  : styles.activePending
                                : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name={`status-${task._id}`}
                              value={s}
                              checked={task.status === s}
                              onChange={() => handleStatusChange(task._id, s)}
                              className={styles.radioInput}
                            />
                            <span>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>

                  {/* ── Reject remark row — only while actively writing a NEW
                      rejection remark. Disappears completely once saved;
                      reappears only if the task is rejected again. ── */}
                  {task.status === "rejected" &&
                    (remarkOpen[task._id] || !task.rejectRemark) && (
                      <tr key={`${task._id}-remark`} className={styles.changeRow}>
                        <td colSpan={TOTAL_COLS}>
                          <div className={styles.addChange}>
                            <textarea
                              className={styles.changeInput}
                              placeholder="Enter reason for rejection…"
                              value={rejectRemark[task._id] ?? ""}
                              onChange={(e) =>
                                setRejectRemark((prev) => ({
                                  ...prev,
                                  [task._id]: e.target.value,
                                }))
                              }
                              rows={2}
                            />
                            <button
                              className={styles.addChangeBtn}
                              onClick={() => saveRemark(task._id)}
                            >
                              Save Remark
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}

                  {/* Change log dropdown — read-only here; employee replies
                      happen on their own dashboard. */}
                  {isExpanded && (
                    <tr key={`${task._id}-changes`} className={styles.changeRow}>
                      <td colSpan={TOTAL_COLS}>
                        {/* ── Subtasks — read-only view of the employee's own checklist ── */}
                        {subtaskCount > 0 && (
                          <div className={styles.changeDropdown} style={{ marginBottom: 12 }}>
                            <div className={styles.changeHeader}>
                              Subtasks — <strong>{task.title}</strong>
                              <span style={{ marginLeft: 8, fontWeight: 400, color: "#64748b" }}>
                                {subtaskDone}/{subtaskCount} completed
                              </span>
                            </div>
                            <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                              {taskAny.subtasks!.map((s) => (
                                <li
                                  key={s._id}
                                  style={{
                                    fontSize: 13,
                                    lineHeight: 1.8,
                                    color: s.status === "completed" ? "#10b981" : "#334155",
                                    textDecoration: s.status === "completed" ? "line-through" : "none",
                                  }}
                                >
                                  {s.status === "completed" ? "✓" : "○"} {s.title}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className={styles.changeDropdown}>
                          <div className={styles.changeHeader}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            Change Log for: <strong>{task.title}</strong>
                          </div>

                          {task.changes.length === 0 ? (
                            <p className={styles.noChanges}>No changes recorded yet.</p>
                          ) : (
                            <div className={styles.changeList}>
                              {task.changes.map((ch) => (
                                <div key={ch._id} className={styles.changeItem}>
                                  <div className={styles.changeTop}>
                                    <span className={styles.changBy}>{ch.changedBy}</span>
                                    <span className={styles.changeDate}>{ch.changedAt}</span>
                                    {ch.resolved && (
                                      <span className={styles.changBy}>✓ Resolved</span>
                                    )}
                                  </div>
                                  <p className={styles.changeNote}>{ch.note}</p>
                                  {ch.employeeResponse && (
                                    <p className={styles.changeNote}>
                                      💬 {ch.employeeResponse}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}

            {tasks.length === 0 && (
              <tr>
                <td colSpan={TOTAL_COLS} className={styles.empty}>No tasks yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}