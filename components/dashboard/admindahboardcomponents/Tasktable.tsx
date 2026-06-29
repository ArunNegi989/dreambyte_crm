"use client";

import { useState } from "react";
import { Task, Employee, TaskStatus } from "@/types/admin/Crm";
import styles from "@/public/assets/styles/dashboard/admindashboard/Tasktable.module.css";

interface TaskTableProps {
  tasks: Task[];
  employees: Employee[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onAddChange: (taskId: string, note: string) => void;
}

export default function TaskTable({
  tasks,
  employees,
  onStatusChange,
  onAddChange,
}: TaskTableProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [changeNote, setChangeNote] = useState<Record<string, string>>({});

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

  const handleAddChange = (taskId: string) => {
    const note = changeNote[taskId]?.trim();
    if (!note) return;
    onAddChange(taskId, note);
    setChangeNote((prev) => ({ ...prev, [taskId]: "" }));
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
              <th>Frequency</th>
              <th>Due Date</th>
              <th>Delivery</th>
              <th>Changes</th>
              <th>Review</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const isExpanded = expandedTask === task._id;
              const hasChanges = task.changes.length > 0;

              return (
                <>
                  <tr key={task._id} className={styles.taskRow}>
                    {/* Task Name */}
                    <td>
                      <div className={styles.taskCell}>
                        <span className={styles.taskName}>{task.title}</span>
                        <span className={styles.taskDesc}>{task.description}</span>
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
                        {/* Delivery note if present */}
                        {task.deliveryNote && (
                          <div className={styles.deliveryNote}>{task.deliveryNote}</div>
                        )}
                      </div>
                    </td>

                    {/* Changes toggle */}
                    <td>
                      <button
                        className={`${styles.changeToggle} ${hasChanges ? styles.hasChanges : ""}`}
                        onClick={() => toggleExpand(task._id)}
                        title="View / Add Changes"
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
                        {(["approved", "rejected", "pending"] as TaskStatus[]).map((s) => (
                          <label
                            key={s}
                            className={`${styles.radioLabel} ${
                              task.status === s
                                ? s === "approved"
                                  ? styles.activeApprove
                                  : s === "rejected"
                                  ? styles.activeReject
                                  : styles.activePending
                                : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name={`status-${task._id}`}
                              value={s}
                              checked={task.status === s}
                              onChange={() => onStatusChange(task._id, s)}
                              className={styles.radioInput}
                            />
                            <span>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>

                  {/* Change log dropdown */}
                  {isExpanded && (
                    <tr key={`${task._id}-changes`} className={styles.changeRow}>
                      <td colSpan={7}>
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
                                  </div>
                                  <p className={styles.changeNote}>{ch.note}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className={styles.addChange}>
                            <textarea
                              className={styles.changeInput}
                              placeholder="Describe what changed in this task..."
                              value={changeNote[task._id] || ""}
                              onChange={(e) =>
                                setChangeNote((prev) => ({
                                  ...prev,
                                  [task._id]: e.target.value,
                                }))
                              }
                              rows={2}
                            />
                            <button
                              className={styles.addChangeBtn}
                              onClick={() => handleAddChange(task._id)}
                            >
                              Add Change Note
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}

            {tasks.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.empty}>No tasks yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}