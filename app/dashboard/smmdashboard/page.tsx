"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import SMMSidebar, { SMMSection } from "@/components/dashboard/smmdashboardcomponents/Smmsidebar";
import SMMStatsCards from "@/components/dashboard/smmdashboardcomponents/Smmstatscards";
import SMMTasksBoard from "@/components/dashboard/smmdashboardcomponents/Smmtasksboard";
import PostingBoard from "@/components/dashboard/smmdashboardcomponents/Postingboard";
import SMMAdditionalWork from "@/components/dashboard/smmdashboardcomponents/Smmadditionalwork";
import SMMHistory from "@/components/dashboard/smmdashboardcomponents/Smmhistory";
import { RawTask, AdditionalWork, isPostingEntry, todayStr } from "@/types/smm/SMM";
import {
  fetchMyTasks,
  fetchBrands,
  BrandOption,
  startTask,
  submitTaskForReview,
  respondToTaskChanges,
  fetchMyAdditionalWork,
  addAdditionalWork,
  markAdditionalWorkDone,
} from "@/app/api/Smmapi";
import styles from "@/app/dashboard/smmdashboard/smmdashboard.module.css";
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

export default function SMMDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSectionState] = useState<SMMSection>("overview");
  const [loggingOut, setLoggingOut] = useState(false);
  useAuthGuard(['employee', 'admin', 'super_admin'], ['smm']); // ⚠️ confirm matches DB value

  const validSections: SMMSection[] = ["overview", "tasks", "posting", "additional", "history"];
  const setActiveSection = (s: SMMSection) => {
    setActiveSectionState(s);
    try {
      localStorage.setItem("smmActiveSection", s);
    } catch {
      // ignore
    }
  };
  useEffect(() => {
    try {
      const saved = localStorage.getItem("smmActiveSection") as SMMSection | null;
      if (saved && validSections.includes(saved)) setActiveSectionState(saved);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Live backend data — no mock arrays anywhere below this line ────────
  const [tasks, setTasks] = useState<RawTask[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [additionalWork, setAdditionalWork] = useState<AdditionalWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Pagination state — one page number per list, keyed by list name ────
  const [pageMap, setPageMap] = useState<Record<string, number>>({});
  const getPage = (key: string) => pageMap[key] || 1;
  const setPage = (key: string, p: number) => setPageMap((prev) => ({ ...prev, [key]: p }));

  const loadAll = useCallback(async () => {
    try {
      setError(null);
      const [t, w, b] = await Promise.all([
        fetchMyTasks(),
        fetchMyAdditionalWork(), // role-filtered server-side → only THIS employee's entries
        fetchBrands().catch(() => [] as BrandOption[]),
      ]);
      setTasks(t);
      setAdditionalWork(w);
      setBrands(b);
    } catch (err) {
      console.error("Failed to load SMM dashboard data", err);
      setError("Could not load your dashboard. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Reset pagination whenever the underlying data actually changes shape.
  useEffect(() => {
    setPageMap({});
  }, [tasks.length, additionalWork.length]);

  // ── Split one Task collection into "general tasks" vs "posting entries" ─
  const generalTasks = useMemo(() => tasks.filter((t) => !isPostingEntry(t)), [tasks]);
  const postingEntries = useMemo(() => tasks.filter(isPostingEntry), [tasks]);

  // ── Shared task actions — the same start/submit/respond flow works for
  // BOTH general tasks and posting entries since they're the same
  // underlying backend Task documents. ────────────────────────────────────
  const handleStartTask = async (id: string) => {
    setTasks((prev) => prev.map((t) => (t._id === id ? { ...t, status: "in_progress" } : t)));
    try {
      await startTask(id);
    } finally {
      loadAll();
    }
  };

// NOTE: startedAt no longer passed — backend stamps it when startTask()
  // is called (via handleStartTask above).
  const handleSubmitTask = async (id: string, note: string) => {
    await submitTaskForReview(id, note);
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

  const today = todayStr();
  const todayGeneralTasks = useMemo(() => generalTasks.filter((t) => t.dueDate === today), [generalTasks, today]);
  const todayGeneralCompleted = todayGeneralTasks.filter(
    (t) => t.status === "completed" || t.status === "approved"
  ).length;

  const todayPosting = useMemo(() => postingEntries.filter((p) => p.dueDate === today), [postingEntries, today]);
  const todayPostingCompleted = todayPosting.filter(
    (p) => p.status === "completed" || p.status === "approved"
  ).length;

  const needsAttention = tasks.filter(
    (t) => t.status === "rejected" || t.status === "changes_requested"
  ).length;

  const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length;

  const additionalPending = additionalWork.filter((w) => w.status !== "completed").length;

  const completedGeneralTasks = useMemo(
    () => generalTasks.filter((t) => t.status === "completed" || t.status === "approved"),
    [generalTasks]
  );
  const completedPosting = useMemo(
    () => postingEntries.filter((p) => p.status === "completed" || p.status === "approved"),
    [postingEntries]
  );

  // ── Paginated slices — one per list that's actually rendered as a table ─
  const overviewGeneralPage = paginateList(todayGeneralTasks, getPage("overviewGeneral"));
  const overviewPostingPage = paginateList(todayPosting, getPage("overviewPosting"));
  const tasksPage = paginateList(generalTasks, getPage("tasks"));
  const postingPage = paginateList(postingEntries, getPage("posting"));
  const additionalPage = paginateList(additionalWork, getPage("additional"));
  const historyGeneralPage = paginateList(completedGeneralTasks, getPage("historyGeneral"));
  const historyPostingPage = paginateList(completedPosting, getPage("historyPosting"));

  const sectionMeta: Record<SMMSection, { title: string; sub: string }> = {
    overview: { title: "Today's Overview", sub: "Your tasks, posting coverage, and extra work at a glance" },
    tasks: { title: "My Tasks", sub: "Scripting, UGC, references, pitch decks, research & calendars" },
    posting: { title: "Posting Tracker", sub: "Brand-by-brand post, video & story coverage" },
    additional: { title: "Additional Work", sub: "Extra tasks outside the regular pipeline" },
    history: { title: "Past Record", sub: "Your complete history of delivered work" },
  };

  return (
    <div className={styles.layout}>
      <SMMSidebar
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
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>
            <div className={styles.smmPill}>
              <span className={styles.pillDot} />
              SMM
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
                  <SMMStatsCards
                    todayTasks={todayGeneralTasks.length}
                    todayCompleted={todayGeneralCompleted}
                    todayPosting={todayPosting.length}
                    todayPostingCompleted={todayPostingCompleted}
                    needsAttention={needsAttention}
                    additionalPending={additionalPending}
                  />
                  <SMMTasksBoard
                    tasks={overviewGeneralPage.pageItems}
                    onStartTask={handleStartTask}
                    onSubmitTask={handleSubmitTask}
                    onRespondChanges={handleRespondChanges}
                    showFilters={false}
                    title="Today's Tasks"
                    subtitle="Everything due today across scripting, UGC, research and more"
                  />
                  <Pagination
                    page={overviewGeneralPage.safePage}
                    totalPages={overviewGeneralPage.totalPages}
                    totalItems={todayGeneralTasks.length}
                    onPrev={() => setPage("overviewGeneral", overviewGeneralPage.safePage - 1)}
                    onNext={() => setPage("overviewGeneral", overviewGeneralPage.safePage + 1)}
                  />
                </>
              )}

              {activeSection === "tasks" && (
                <>
                  <SMMTasksBoard
                    tasks={tasksPage.pageItems}
                    onStartTask={handleStartTask}
                    onSubmitTask={handleSubmitTask}
                    onRespondChanges={handleRespondChanges}
                  />
                  <Pagination
                    page={tasksPage.safePage}
                    totalPages={tasksPage.totalPages}
                    totalItems={generalTasks.length}
                    onPrev={() => setPage("tasks", tasksPage.safePage - 1)}
                    onNext={() => setPage("tasks", tasksPage.safePage + 1)}
                  />
                </>
              )}

              {activeSection === "posting" && (
                <>
                  <PostingBoard
                    entries={postingPage.pageItems}
                    brands={brands}
                    onStartTask={handleStartTask}
                    onSubmitTask={handleSubmitTask}
                    onRespondChanges={handleRespondChanges}
                  />
                  <Pagination
                    page={postingPage.safePage}
                    totalPages={postingPage.totalPages}
                    totalItems={postingEntries.length}
                    onPrev={() => setPage("posting", postingPage.safePage - 1)}
                    onNext={() => setPage("posting", postingPage.safePage + 1)}
                  />
                </>
              )}

              {activeSection === "additional" && (
                <>
                  <SMMAdditionalWork
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
                  <SMMHistory completedTasks={historyGeneralPage.pageItems} completedPosting={historyPostingPage.pageItems} />
                  <Pagination
                    page={historyGeneralPage.safePage}
                    totalPages={historyGeneralPage.totalPages}
                    totalItems={completedGeneralTasks.length}
                    onPrev={() => setPage("historyGeneral", historyGeneralPage.safePage - 1)}
                    onNext={() => setPage("historyGeneral", historyGeneralPage.safePage + 1)}
                  />
                  <Pagination
                    page={historyPostingPage.safePage}
                    totalPages={historyPostingPage.totalPages}
                    totalItems={completedPosting.length}
                    onPrev={() => setPage("historyPosting", historyPostingPage.safePage - 1)}
                    onNext={() => setPage("historyPosting", historyPostingPage.safePage + 1)}
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