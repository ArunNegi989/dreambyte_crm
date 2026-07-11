"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { Employee, Task, Brand } from "@/types/superadmin/superAdmin";
import {
  computeEmployeeProgressStats,
  getTasksForEmployee,
  countRejectionCycles,
  getTimeTakenMinutes,
  formatMinutes,
  AdditionalWorkEntry,
} from "@/data/superadmin/employeeProgressHelpers";
import PieChartSVG from "./charts/Piechartsvg";
import BarChartSVG from "./charts/Barchartsvg";
import LineChartSVG from "./charts/Linechartsvg";
import styles from "@/public/assets/styles/dashboard/super-admin-dashboard/Saemployeeprogressmodal.module.css";

interface SAEmployeeProgressModalProps {
  employee: Employee;
  tasks: Task[];
  brands: Brand[];
  onClose: () => void;
}

type RangeTab = "weekly" | "monthly";

export default function SAEmployeeProgressModal({
  employee,
  tasks,
  brands,
  onClose,
}: SAEmployeeProgressModalProps) {
  const [range, setRange] = useState<RangeTab>("weekly");
  const [additionalWork, setAdditionalWork] = useState<AdditionalWorkEntry[]>([]);
  const [awLoading, setAwLoading] = useState(true);
  const [awError, setAwError] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // ── Animated score ring ────────────────────────────────────────────────
  const RING_RADIUS = 44;
  const RING_CIRC = 2 * Math.PI * RING_RADIUS;
  const [ringOffset, setRingOffset] = useState(RING_CIRC);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Load this employee's additional (extra) logged work ──────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setAwLoading(true);
        setAwError(null);
        const res = await api.get(`/additional-work?assignedTo=${employee._id}`);
        if (!cancelled) setAdditionalWork(res.data?.data ?? []);
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load additional work";
          setAwError(msg);
        }
      } finally {
        if (!cancelled) setAwLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [employee._id]);

  const empTasks = useMemo(() => getTasksForEmployee(tasks, employee._id), [tasks, employee._id]);
  const stats = useMemo(() => computeEmployeeProgressStats(tasks, employee._id), [tasks, employee._id]);

  const getBrandName = (brandId?: string | { _id: string; name: string } | null) => {
    if (!brandId) return "—";
    if (typeof brandId === "object") return brandId.name;
    return brands.find((b) => b._id === brandId)?.name ?? "—";
  };

  // ── Weekly / monthly bar-chart data (Assigned vs Completed) ──────────────
  const barData =
    range === "weekly"
      ? stats.weekly.map((w) => ({
          label: w.label,
          values: [
            { key: "assigned", value: w.assigned, color: "#c7d2fe" },
            { key: "completed", value: w.completed, color: "#10b981" },
          ],
        }))
      : stats.monthly.map((m) => ({
          label: m.label,
          values: [
            { key: "assigned", value: m.assigned, color: "#c7d2fe" },
            { key: "completed", value: m.completed, color: "#10b981" },
          ],
        }));

  // ── Weekly / monthly line-chart data (completion rate trend) ─────────────
  const lineData =
    range === "weekly"
      ? stats.weekly.map((w) => ({
          label: w.label,
          value: w.assigned === 0 ? 0 : Math.round((w.completed / w.assigned) * 100),
        }))
      : stats.monthly.map((m) => ({
          label: m.label,
          value: m.assigned === 0 ? 0 : Math.round((m.completed / m.assigned) * 100),
        }));

  // ── "kitne task ek din mai" — average tasks completed per day ────────────
  const last = range === "weekly" ? stats.weekly[stats.weekly.length - 1] : stats.monthly[stats.monthly.length - 1];
  const perDayAvg =
    range === "weekly"
      ? last
        ? (last.completed / 7).toFixed(1)
        : "0.0"
      : last
      ? (last.completed / 30).toFixed(1)
      : "0.0";

  const totalRejectedCyclesThisRange =
    range === "weekly"
      ? stats.weekly.reduce((s, w) => s + w.rejected, 0)
      : stats.monthly.reduce((s, m) => s + m.rejected, 0);

  const scoreColor =
    stats.progress.score >= 80 ? "#10b981" : stats.progress.score >= 50 ? "#f59e0b" : "#ef4444";

  useEffect(() => {
    const t = setTimeout(() => {
      setRingOffset(RING_CIRC - (stats.progress.score / 100) * RING_CIRC);
    }, 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.progress.score]);

  const statusStyles: Record<string, string> = {
    completed: styles.sCompleted,
    pending: styles.sPending,
    rejected: styles.sRejected,
    approved: styles.sApproved,
    in_progress: styles.sInProgress,
    changes_requested: styles.sInProgress,
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* ── Header ── */}
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>{employee.name[0]}</div>
          <div className={styles.profileInfo}>
            <h2 className={styles.name}>{employee.name}</h2>
            <p className={styles.roleText}>
              <span className={`${styles.rolePill} ${styles[`role_${employee.role}`]}`}>
                {employee.role === "super_admin" ? "Super Admin" : employee.role === "admin" ? "Admin" : "Employee"}
              </span>
              <span className={styles.dot}>·</span>
              {employee.department}
              <span className={styles.dot}>·</span>
              {employee.employeeId}
            </p>
          </div>
          <div className={styles.scoreRingWrap}>
            <svg width="104" height="104" viewBox="0 0 104 104">
              <circle cx="52" cy="52" r={RING_RADIUS} fill="none" stroke="#f1f5f9" strokeWidth="9" />
              <circle
                cx="52"
                cy="52"
                r={RING_RADIUS}
                fill="none"
                stroke={scoreColor}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={RING_CIRC}
                strokeDashoffset={ringOffset}
                transform="rotate(-90 52 52)"
                className={styles.scoreRingCircle}
              />
            </svg>
            <div className={styles.scoreRingCenter}>
              <span className={styles.scoreNum} style={{ color: scoreColor }}>
                {stats.progress.score}
              </span>
              <span className={styles.scoreLabel}>Score</span>
            </div>
          </div>
        </div>

        {/* ── Top Stat Row ── */}
        <div className={styles.statRow}>
          <div className={styles.statBox}>
            <span className={styles.statNum}>{stats.totalTasks}</span>
            <span className={styles.statLabel}>Total Tasks</span>
          </div>
          <div className={styles.statBox} style={{ background: "#f0fdf4" }}>
            <span className={styles.statNum} style={{ color: "#10b981" }}>{stats.completedTasks}</span>
            <span className={styles.statLabel}>Completed</span>
          </div>
          <div className={styles.statBox} style={{ background: "#fffbeb" }}>
            <span className={styles.statNum} style={{ color: "#f59e0b" }}>{stats.pendingTasks}</span>
            <span className={styles.statLabel}>Pending</span>
          </div>
          <div className={styles.statBox} style={{ background: "#fef2f2" }}>
            <span className={styles.statNum} style={{ color: "#ef4444" }}>{stats.rejectedTasks}</span>
            <span className={styles.statLabel}>Rejected</span>
          </div>
          <div className={styles.statBox} style={{ background: "#f5f3ff" }}>
            <span className={styles.statNum} style={{ color: "#6d28d9" }}>{stats.totalRejectionCycles}</span>
            <span className={styles.statLabel}>Reject → Redo Cycles</span>
          </div>
          <div className={styles.statBox} style={{ background: "#eff6ff" }}>
            <span className={styles.statNum} style={{ color: "#1d4ed8" }}>{stats.avgTimeTakenLabel}</span>
            <span className={styles.statLabel}>Avg. Time / Task</span>
          </div>
        </div>

        {/* ── Progress score breakdown note ── */}
        <div className={styles.scoreNote}>
          <span>
            Score = <strong>{stats.progress.completionRate}%</strong> completion rate
            {stats.progress.rejectionPenalty > 0 && (
              <>
                {" "}
                − <strong>{stats.progress.rejectionPenalty}</strong> pts penalty (
                {stats.progress.totalRejections} reject cycle{stats.progress.totalRejections === 1 ? "" : "s"})
              </>
            )}
            . Har baar task reject hoke dobara bhejna is score ko neeche khinchta hai.
          </span>
        </div>

        {/* ── Charts Section ── */}
        <div className={styles.section}>
          <div className={styles.sectionHeaderRow}>
            <h3 className={styles.sectionTitle}>Progress Report</h3>
            <div className={styles.rangeToggle}>
              <button
                className={`${styles.rangeBtn} ${range === "weekly" ? styles.rangeActive : ""}`}
                onClick={() => setRange("weekly")}
              >
                Weekly
              </button>
              <button
                className={`${styles.rangeBtn} ${range === "monthly" ? styles.rangeActive : ""}`}
                onClick={() => setRange("monthly")}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className={styles.miniStatRow}>
            <div className={styles.miniStat}>
              <span className={styles.miniStatVal}>{perDayAvg}</span>
              <span className={styles.miniStatLabel}>
                Avg. tasks completed / day (last {range === "weekly" ? "7 days" : "30 days"})
              </span>
            </div>
            <div className={styles.miniStat}>
              <span className={styles.miniStatVal}>
                {last ? last.completed : 0}/{last ? last.assigned : 0}
              </span>
              <span className={styles.miniStatLabel}>
                Completed this {range === "weekly" ? "week" : "month"}
              </span>
            </div>
            <div className={styles.miniStat}>
              <span className={styles.miniStatVal} style={{ color: totalRejectedCyclesThisRange > 0 ? "#ef4444" : "#10b981" }}>
                {totalRejectedCyclesThisRange}
              </span>
              <span className={styles.miniStatLabel}>
                Rejections in shown {range === "weekly" ? "weeks" : "months"}
              </span>
            </div>
          </div>

          <div className={styles.chartGrid}>
            {/* Bar chart — assigned vs completed */}
            <div className={styles.chartCard}>
              <h4 className={styles.chartTitle}>
                {range === "weekly" ? "Weekly" : "Monthly"} — Assigned vs Completed
              </h4>
              <BarChartSVG
                data={barData}
                legend={[
                  { key: "assigned", label: "Assigned", color: "#c7d2fe" },
                  { key: "completed", label: "Completed", color: "#10b981" },
                ]}
              />
            </div>

            {/* Line chart — completion rate trend */}
            <div className={styles.chartCard}>
              <h4 className={styles.chartTitle}>Completion Rate Trend</h4>
              <LineChartSVG data={lineData} color="#6366f1" />
            </div>

            {/* Pie chart — status breakdown */}
            <div className={styles.chartCard}>
              <h4 className={styles.chartTitle}>Task Status Breakdown</h4>
              <PieChartSVG
                data={stats.statusBreakdown}
                centerValue={stats.totalTasks}
                centerLabel="Total"
              />
            </div>

            {/* Pie chart — delivered vs not delivered */}
            <div className={styles.chartCard}>
              <h4 className={styles.chartTitle}>Delivery Status</h4>
              <PieChartSVG
                data={[
                  { label: "Delivered", value: stats.deliveredCount, color: "#10b981" },
                  { label: "Not Delivered", value: stats.notDeliveredCount, color: "#f59e0b" },
                ]}
                centerValue={`${
                  stats.totalTasks === 0 ? 0 : Math.round((stats.deliveredCount / stats.totalTasks) * 100)
                }%`}
                centerLabel="Delivered"
              />
            </div>
          </div>
        </div>

        {/* ── Task-level detail: time taken + reviews/remarks + change log ── */}
        <div className={styles.section}>
          <div className={styles.taskSectionHeader}>
            <h3 className={styles.sectionTitle}>Task-wise Detail &amp; Remarks</h3>
            <span className={styles.taskCount}>{empTasks.length} tasks</span>
          </div>

          {empTasks.length === 0 ? (
            <div className={styles.emptyBox}>
              <span>📋</span>
              <p>No tasks assigned yet.</p>
            </div>
          ) : (
            <div className={styles.taskDetailList}>
              {empTasks.map((task) => {
                const tAny = task as unknown as { startedAt?: string | null; deliveredAt?: string | null };
                const mins = getTimeTakenMinutes(tAny.startedAt, tAny.deliveredAt);
                const rejections = countRejectionCycles(task);
                const isOpen = expandedTaskId === task._id;

                return (
                  <div key={task._id} className={styles.taskDetailCard}>
                    <div
                      className={styles.taskDetailTop}
                      onClick={() => setExpandedTaskId(isOpen ? null : task._id)}
                    >
                      <div className={styles.taskDetailLeft}>
                        <span className={`${styles.statusPill} ${statusStyles[task.status] ?? ""}`}>
                          {task.status.replace("_", " ")}
                        </span>
                        <div>
                          <div className={styles.taskDetailTitle}>{task.title}</div>
                          <div className={styles.taskDetailMeta}>
                            {getBrandName(task.brandId ?? undefined)} &middot; Due {task.dueDate || "—"}
                          </div>
                        </div>
                      </div>
                      <div className={styles.taskDetailRight}>
                        <span className={styles.taskDetailTime} title="Time taken">
                          ⏱ {formatMinutes(mins)}
                        </span>
                        {rejections > 0 && (
                          <span className={styles.rejectCountPill}>
                            ↺ {rejections} redo{rejections === 1 ? "" : "s"}
                          </span>
                        )}
                        <span className={styles.expandArrow}>{isOpen ? "▲" : "▼"}</span>
                      </div>
                    </div>

                    {isOpen && (
                      <div className={styles.taskDetailBody}>
                        {task.description && <p className={styles.taskDesc}>{task.description}</p>}

                        {task.changes.length === 0 ? (
                          <p className={styles.noCh}>No reviews / remarks logged for this task yet.</p>
                        ) : (
                          <div className={styles.chList}>
                            {task.changes.map((ch, idx) => (
                              <div key={ch._id} className={styles.chItem}>
                                <div className={styles.chTop}>
                                  <span className={styles.chIdx}>#{idx + 1}</span>
                                  <span className={styles.chBy}>{ch.changedBy}</span>
                                  <span className={styles.chDate}>{ch.changedAt}</span>
                                  {ch.note?.startsWith("Rejected by") && (
                                    <span className={styles.chRejectTag}>Rejected</span>
                                  )}
                                  {ch.resolved && <span className={styles.chResolvedBadge}>✓ Resolved</span>}
                                </div>
                                <p className={styles.chNote}>{ch.note}</p>
                                {ch.employeeResponse && (
                                  <div className={styles.chEmpResponse}>
                                    <span className={styles.chEmpLabel}>💬 Employee reply</span>
                                    <p className={styles.chEmpText}>{ch.employeeResponse}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Additional Work ── */}
        <div className={styles.section}>
          <div className={styles.taskSectionHeader}>
            <h3 className={styles.sectionTitle}>Additional Work Logged</h3>
            <span className={styles.taskCount}>{additionalWork.length} entries</span>
          </div>

          {awLoading && <p className={styles.loadingText}>Loading additional work…</p>}
          {awError && <p className={styles.errorText}>⚠️ {awError}</p>}

          {!awLoading && !awError && (
            additionalWork.length === 0 ? (
              <div className={styles.emptyBox}>
                <span>🧾</span>
                <p>No additional work logged yet.</p>
              </div>
            ) : (
              <div className={styles.awList}>
                {additionalWork.map((aw) => (
                  <div key={aw._id} className={styles.awCard}>
                    <div className={styles.awTop}>
                      <span className={styles.awTitle}>{aw.title}</span>
                      <span className={`${styles.awStatus} ${aw.status === "completed" ? styles.awDone : styles.awPending}`}>
                        {aw.status}
                      </span>
                    </div>
                    {aw.description && <p className={styles.awDesc}>{aw.description}</p>}
                    <div className={styles.awMeta}>
                      <span>📅 {aw.date}</span>
                      {aw.category && aw.category !== "other" && <span>🏷 {aw.category}</span>}
                      {aw.hoursSpent != null && <span>⏱ {aw.hoursSpent}h</span>}
                      <span>{aw.loggedBy === "self" ? "Logged by employee" : "Logged by admin"}</span>
                    </div>
                    {aw.outcome && (
                      <div className={styles.awOutcome}>
                        <span className={styles.awOutcomeLabel}>Outcome</span>
                        <p>{aw.outcome}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}