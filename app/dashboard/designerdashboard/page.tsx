"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DesignerSidebar, { DesignerSection } from "@/components/dashboard/designerdashboard/Designersidebar";
import DesignerStatsCards from "@/components/dashboard/designerdashboard/Designerstatscards";
import DesignerTasksBoard from "@/components/dashboard/designerdashboard/Designertasksboard";
import DesignerAdditionalWork from "@/components/dashboard/designerdashboard/Designeradditionalwork";
import DesignerHistory from "@/components/dashboard/designerdashboard/Designerhistory";
import { DesignTask, AdditionalWork, todayStr } from "@/types/designer/Designer";
import {
  fetchMyTasks,
  fetchMyAdditionalWork,
  startTask,
  submitTaskForReview,
  respondToTaskChanges,
  addAdditionalWork,
  markAdditionalWorkDone,
} from "@/app/api/Designerapi";
import styles from "@/public/assets/styles/dashboard/designerdashboard/Designerdashboard.module.css";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { logout } from "@/app/api/authApi";

const PAGE_SIZE = 10;

// ── Pagination helpers (inlined — no shared util file) ──────────────────
function paginateList<T>(items: T[], page: number, pageSize = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageItems = items.slice((safePage - 1) * pageSize, safePage * pageSize);
  return { pageItems, totalPages, safePage };
}

function Pagination({
  page,
  totalPages,
  totalItems,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "14px 0 4px" }}>
      <button
        type="button"
        onClick={onPrev}
        disabled={page <= 1}
        style={{
          padding: "4px 10px",
          fontSize: 12,
          borderRadius: 6,
          border: "1px solid #e2e8f0",
          background: "#fff",
          cursor: page <= 1 ? "not-allowed" : "pointer",
          opacity: page <= 1 ? 0.5 : 1,
        }}
      >
        Prev
      </button>
      <span style={{ fontSize: 12.5, color: "#64748b" }}>
        Page {page} of {totalPages} · {totalItems} items
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={page >= totalPages}
        style={{
          padding: "4px 10px",
          fontSize: 12,
          borderRadius: 6,
          border: "1px solid #e2e8f0",
          background: "#fff",
          cursor: page >= totalPages ? "not-allowed" : "pointer",
          opacity: page >= totalPages ? 0.5 : 1,
        }}
      >
        Next
      </button>
    </div>
  );
}

export default function DesignerDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSectionState] = useState<DesignerSection>("overview");
  const [loggingOut, setLoggingOut] = useState(false);
  useAuthGuard(['employee', 'admin', 'super_admin'], ['designer']); // ⚠️ confirm 'designer' matches DB value

  const validSections: DesignerSection[] = ["overview", "tasks", "additional", "history"];
  const setActiveSection = (s: DesignerSection) => {
    setActiveSectionState(s);
    try {
      localStorage.setItem("designerActiveSection", s);
    } catch {
      // ignore
    }
  };
  useEffect(() => {
    try {
      const saved = localStorage.getItem("designerActiveSection") as DesignerSection | null;
      if (saved && validSections.includes(saved)) setActiveSectionState(saved);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Live backend data — no mock arrays anywhere below this line ────────
  const [tasks, setTasks] = useState<DesignTask[]>([]);
  const [additionalWork, setAdditionalWork] = useState<AdditionalWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date shown next to the date chip in the top bar. Defaults to today;
  // changing it lets the designer look back at any previous date's tasks
  // right from the Overview tab, without leaving the page.
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const isToday = selectedDate === todayStr();

  // ── Pagination state — one page number per list, keyed by list name ────
  const [pageMap, setPageMap] = useState<Record<string, number>>({});
  const getPage = (key: string) => pageMap[key] || 1;
  const setPage = (key: string, p: number) => setPageMap((prev) => ({ ...prev, [key]: p }));

  const loadAll = useCallback(async () => {
    try {
      setError(null);
      const [t, w] = await Promise.all([fetchMyTasks(), fetchMyAdditionalWork()]);
      setTasks(t);
      setAdditionalWork(w);
    } catch (err) {
      console.error("Failed to load designer dashboard data", err);
      setError("Could not load your tasks. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Reset pagination whenever the underlying data (or selected date) changes shape.
  useEffect(() => {
    setPageMap({});
  }, [tasks.length, additionalWork.length, selectedDate]);

  // ── Task actions — each hits the backend then re-syncs from server so
  // the UI always reflects the real source of truth (esp. important since
  // status changes cascade into changes[]/deliveryStatus server-side). ───
  const handleStartTask = async (id: string) => {
    setTasks((prev) => prev.map((t) => (t._id === id ? { ...t, status: "in_progress" } : t)));
    try {
      await startTask(id);
    } finally {
      loadAll();
    }
  };

  const handleSubmitTask = async (id: string, note: string) => {
    const task = tasks.find((t) => t._id === id);
    await submitTaskForReview(id, note, task?.startedAt ?? undefined);
    await loadAll();
  };

  const handleRespondChanges = async (
    id: string,
    responses: { id: string; response: string }[]
  ) => {
    await respondToTaskChanges(id, responses);
    await loadAll();
  };

  // ── Additional work actions ─────────────────────────────────────────────
  const handleAdditionalStatusChange = async (id: string) => {
    setAdditionalWork((prev) => prev.map((w) => (w._id === id ? { ...w, status: "completed" } : w)));
    try {
      await markAdditionalWorkDone(id);
    } finally {
      loadAll();
    }
  };

  const handleAddAdditionalWork = async (title: string, description: string) => {
    await addAdditionalWork(title, description);
    await loadAll();
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      router.replace("/auth/login");
    }
  };

  const todayTasks = useMemo(() => tasks.filter((t) => t.dueDate === selectedDate), [tasks, selectedDate]);
  const todayCompleted = todayTasks.filter((t) => t.status === "completed" || t.status === "approved").length;

  const needsAttention = tasks.filter(
    (t) => t.status === "rejected" || t.status === "changes_requested"
  ).length;

  const pendingTasks = tasks.filter(
    (t) => t.status === "pending" || t.status === "in_progress"
  ).length;

  const monthStr = todayStr().slice(0, 7);
  const completedThisMonth = tasks.filter(
    (t) =>
      (t.status === "completed" || t.status === "approved") &&
      (t.deliveredAt ?? t.dueDate ?? "").startsWith(monthStr)
  ).length;

  const additionalPending = additionalWork.filter((w) => w.status !== "completed").length;

  const completedTasks = useMemo(
    () => tasks.filter((t) => t.status === "completed" || t.status === "approved"),
    [tasks]
  );

  // ── Paginated slices ─────────────────────────────────────────────────────
  const overviewPage = paginateList(todayTasks, getPage("overview"));
  const tasksPage = paginateList(tasks, getPage("tasks"));
  const additionalPage = paginateList(additionalWork, getPage("additional"));
  const historyPage = paginateList(completedTasks, getPage("history"));

  const sectionMeta: Record<DesignerSection, { title: string; sub: string }> = {
    overview: { title: "Today's Overview", sub: "Your tasks, changes, and extra work at a glance" },
    tasks: { title: "My Tasks", sub: "Filter and track everything assigned to you" },
    additional: { title: "Additional Work", sub: "Extra tasks outside the regular pipeline" },
    history: { title: "Past Record", sub: "Your complete history of delivered work" },
  };

  return (
    <div className={styles.layout}>
      <DesignerSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        pendingTasks={pendingTasks}
        needsAttention={needsAttention}
      />

      <main className={styles.main}>
        <div className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>{sectionMeta[activeSection].title}</h1>
            <p className={styles.pageSub}>{sectionMeta[activeSection].sub}</p>
          </div>
          <div className={styles.topBarRight}>
            <div className={styles.dateChip}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {new Date(selectedDate).toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              {/* ── Date filter: lets the designer jump to any previous date's tasks ── */}
              <input
                type="date"
                value={selectedDate}
                max={todayStr()}
                onChange={(e) => setSelectedDate(e.target.value || todayStr())}
                title="Check tasks from a previous date"
                style={{
                  marginLeft: 8,
                  border: "none",
                  background: "transparent",
                  fontSize: 12,
                  cursor: "pointer",
                  color: "inherit",
                  colorScheme: "light",
                }}
              />
              {!isToday && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr())}
                  style={{
                    marginLeft: 4,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 11,
                    textDecoration: "underline",
                    color: "inherit",
                    padding: 0,
                  }}
                >
                  Today
                </button>
              )}
            </div>
            <div className={styles.designerPill}>
              <span className={styles.pillDot} />
              Designer
            </div>
            <button
              type="button"
              className={styles.logoutBtn}
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {loggingOut ? "Signing out…" : "Logout"}
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>Loading your dashboard…</div>
          ) : error ? (
            <div style={{ padding: 48, textAlign: "center", color: "#b91c1c" }}>
              {error}{" "}
              <button
                onClick={loadAll}
                style={{ textDecoration: "underline", cursor: "pointer", background: "none", border: "none", color: "#b91c1c" }}
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {activeSection === "overview" && (
                <>
                  <DesignerStatsCards
                    todayTasks={todayTasks.length}
                    todayCompleted={todayCompleted}
                    needsAttention={needsAttention}
                    completedThisMonth={completedThisMonth}
                    additionalPending={additionalPending}
                  />
                  <DesignerTasksBoard
                    tasks={overviewPage.pageItems}
                    onStartTask={handleStartTask}
                    onSubmitTask={handleSubmitTask}
                    onRespondChanges={handleRespondChanges}
                    showFilters={false}
                    title={isToday ? "Today's Tasks" : `Tasks — ${selectedDate}`}
                    subtitle="Everything due on this date across all task types"
                  />
                  <Pagination
                    page={overviewPage.safePage}
                    totalPages={overviewPage.totalPages}
                    totalItems={todayTasks.length}
                    onPrev={() => setPage("overview", overviewPage.safePage - 1)}
                    onNext={() => setPage("overview", overviewPage.safePage + 1)}
                  />
                </>
              )}

              {activeSection === "tasks" && (
                <>
                  <DesignerTasksBoard
                    tasks={tasksPage.pageItems}
                    onStartTask={handleStartTask}
                    onSubmitTask={handleSubmitTask}
                    onRespondChanges={handleRespondChanges}
                  />
                  <Pagination
                    page={tasksPage.safePage}
                    totalPages={tasksPage.totalPages}
                    totalItems={tasks.length}
                    onPrev={() => setPage("tasks", tasksPage.safePage - 1)}
                    onNext={() => setPage("tasks", tasksPage.safePage + 1)}
                  />
                </>
              )}

              {activeSection === "additional" && (
                <>
                  <DesignerAdditionalWork
                    items={additionalPage.pageItems}
                    onStatusChange={handleAdditionalStatusChange}
                    onAddItem={handleAddAdditionalWork}
                  />
                  <Pagination
                    page={additionalPage.safePage}
                    totalPages={additionalPage.totalPages}
                    totalItems={additionalWork.length}
                    onPrev={() => setPage("additional", additionalPage.safePage - 1)}
                    onNext={() => setPage("additional", additionalPage.safePage + 1)}
                  />
                </>
              )}

              {activeSection === "history" && (
                <>
                  <DesignerHistory tasks={historyPage.pageItems} />
                  <Pagination
                    page={historyPage.safePage}
                    totalPages={historyPage.totalPages}
                    totalItems={completedTasks.length}
                    onPrev={() => setPage("history", historyPage.safePage - 1)}
                    onNext={() => setPage("history", historyPage.safePage + 1)}
                  />
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}