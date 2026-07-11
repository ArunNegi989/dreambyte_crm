"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PhotoSidebar, { PhotoSection } from "@/components/dashboard/photographerdashboard/Photosidebar";
import PhotoStatsCards from "@/components/dashboard/photographerdashboard/Photostatscards";
import ShootsBoard from "@/components/dashboard/photographerdashboard/Shootsboard";
import EditsBoard from "@/components/dashboard/photographerdashboard/Editsboard";
import AdditionalWorkBoard from "@/components/dashboard/photographerdashboard/Additionalwork";
import {
  RawTask,
  RawAdditionalWork,
  Shoot,
  EditTask,
  AdditionalWork,
  WorkStatus,
  TODAY,
  isShootTask,
  isEditTask,
  mapToShoot,
  mapToEditTask,
  mapToAdditionalWork,
  fetchMyTasks,
  updateTaskStatus,
  updateEditProgress,
  respondToRejection,
  fetchMyAdditionalWork,
  createAdditionalWork,
  updateAdditionalWorkStatus,
} from "@/types/photography/Photo";
import styles from "@/app/dashboard/photographydashboard/Photographerdashboard.module.css";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { logout } from "@/app/api/authApi";

const PAGE_SIZE = 10;

// ── Date helpers for the Overview date navigator ───────────────────────────
const shiftDate = (dateStr: string, days: number) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

const overviewDateLabel = (dateStr: string) => {
  if (dateStr === TODAY) return "Today";
  const yesterday = shiftDate(TODAY, -1);
  const tomorrow = shiftDate(TODAY, 1);
  if (dateStr === yesterday) return "Yesterday";
  if (dateStr === tomorrow) return "Tomorrow";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

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

export default function PhotographerDashboard() {
  useAuthGuard(['employee', 'admin', 'super_admin'], ['photography']); // ⚠️ confirm matches DB value
  const router = useRouter();
  const [activeSection, setActiveSectionState] = useState<PhotoSection>("overview");
  const [loggingOut, setLoggingOut] = useState(false);

  // ── Persist active tab across refresh ──────────────────────────────────
  const validSections: PhotoSection[] = ["overview", "shoots", "edits", "additional"];
  const setActiveSection = (s: PhotoSection) => {
    setActiveSectionState(s);
    try {
      localStorage.setItem("photoActiveSection", s);
    } catch {
      // ignore
    }
  };
  useEffect(() => {
    try {
      const saved = localStorage.getItem("photoActiveSection") as PhotoSection | null;
      if (saved && validSections.includes(saved)) setActiveSectionState(saved);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Overview date filter — lets the photographer browse previous days'
  // shoots/edits instead of only ever seeing today's. Defaults to today. ──
  const [overviewDate, setOverviewDate] = useState<string>(TODAY);

  // ── Current logged-in photographer's id ────────────────────────────────
  const [employeeId, setEmployeeId] = useState<string>("");
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        setEmployeeId(parsed?._id || parsed?.id || "");
      }
    } catch {
      setEmployeeId("");
    }
  }, []);

  // ── Logout handler ──────────────────────────────────────────────────────
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout("employee");
    } finally {
      router.replace("/auth/login");
    }
  };

  // ── Real backend data ───────────────────────────────────────────────────
  const [rawTasks, setRawTasks] = useState<RawTask[]>([]);
  const [additionalWork, setAdditionalWork] = useState<AdditionalWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Pagination state — one page number per list, keyed by list name ────
  const [pageMap, setPageMap] = useState<Record<string, number>>({});
  const getPage = (key: string) => pageMap[key] || 1;
  const setPage = (key: string, p: number) => setPageMap((prev) => ({ ...prev, [key]: p }));

  const loadAll = useCallback(async () => {
    if (!employeeId) return;
    try {
      setLoading(true);
      setError(null);
      const [tasks, work] = await Promise.all([
        fetchMyTasks(employeeId),
        fetchMyAdditionalWork(employeeId),
      ]);
      setRawTasks(tasks);
      setAdditionalWork((work as RawAdditionalWork[]).map(mapToAdditionalWork));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Reset pagination whenever the underlying data (or overview date) changes shape.
  useEffect(() => {
    setPageMap({});
  }, [rawTasks.length, additionalWork.length, overviewDate]);

  // ── Derived view-shapes ──────────────────────────────────────────────────
  const shoots: Shoot[] = useMemo(
    () => rawTasks.filter(isShootTask).map(mapToShoot),
    [rawTasks]
  );
  const edits: EditTask[] = useMemo(
    () => rawTasks.filter(isEditTask).map(mapToEditTask),
    [rawTasks]
  );

  // ── Handlers — every action hits the real backend, then refetches ──────
  const handleShootStatusChange = async (id: string, status: WorkStatus) => {
    try {
      await updateTaskStatus(id, status);
      await loadAll();
    } catch (err) {
      console.error("Shoot status update failed", err);
    }
  };

  const handleEditProgressChange = async (id: string, completedCount: number) => {
    try {
      await updateEditProgress(id, completedCount);
      await loadAll();
    } catch (err) {
      console.error("Edit progress update failed", err);
    }
  };

  // Employee replies to a rejection note and resubmits — closes the open
  // change entry (marks resolved + attaches the response) and flips the
  // task back to completed/delivered on the backend.
  const handleResubmit = async (id: string, changeId: string, responseText: string) => {
    try {
      await respondToRejection(id, changeId, responseText);
      await loadAll();
    } catch (err) {
      console.error("Resubmit failed", err);
    }
  };

  const handleAdditionalStatusChange = async (id: string, status: WorkStatus) => {
    try {
      await updateAdditionalWorkStatus(id, status === "completed" ? "completed" : "pending");
      await loadAll();
    } catch (err) {
      console.error("Additional work status update failed", err);
    }
  };

  const handleAddAdditionalWork = async (title: string, description: string) => {
    try {
      await createAdditionalWork(employeeId, title, description);
      await loadAll();
    } catch (err) {
      console.error("Failed to log additional work", err);
    }
  };

  // ── Derived stats — now based on the selected overview date, not just
  // a hardcoded "today", so switching the date navigator updates
  // everything on the Overview tab (stats cards + the two boards). ──────
  const overviewShoots = shoots.filter((s) => s.date === overviewDate);
  const overviewEdits = edits.filter((e) => e.date === overviewDate || e.deadline === overviewDate);

  // "approved" counts as done too, same as "completed" — an admin-approved
  // shoot/edit shouldn't still show up as pending on the overview.
  const isDone = (status: WorkStatus) => status === "completed" || status === "approved";

  const overviewShootsCompleted = overviewShoots.filter((s) => isDone(s.status)).length;
  const overviewEditsCompleted = overviewEdits.filter((e) => isDone(e.status)).length;

  const pendingShoots = shoots.filter((s) => !isDone(s.status)).length;
  const pendingEdits = edits.filter((e) => !isDone(e.status)).length;
  const additionalPending = additionalWork.filter((w) => w.status !== "completed").length;

  // ── Paginated slices ─────────────────────────────────────────────────────
  const overviewShootsPage = paginateList(overviewShoots, getPage("overviewShoots"));
  const overviewEditsPage = paginateList(overviewEdits, getPage("overviewEdits"));
  const shootsPage = paginateList(shoots, getPage("shoots"));
  const editsPage = paginateList(edits, getPage("edits"));
  const additionalPage = paginateList(additionalWork, getPage("additional"));

  const sectionMeta: Record<PhotoSection, { title: string; sub: string }> = {
    overview: {
      title: overviewDate === TODAY ? "Today's Overview" : `Overview — ${overviewDateLabel(overviewDate)}`,
      sub: "Your shoots, edits, and extra work at a glance",
    },
    shoots: { title: "Shoots", sub: "Everything assigned to you, grouped by day" },
    edits: { title: "Edits", sub: "Photo and video edit queue with progress tracking" },
    additional: { title: "Additional Work", sub: "Extra tasks outside the regular pipeline" },
  };

  return (
    <div className={styles.layout}>
      <PhotoSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        pendingShoots={pendingShoots}
        pendingEdits={pendingEdits}
      />

      <main className={styles.main}>
        <div className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>{sectionMeta[activeSection].title}</h1>
            <p className={styles.pageSub}>{sectionMeta[activeSection].sub}</p>
          </div>
          <div className={styles.topBarRight}>
            {/* ── Date navigator — only meaningful on the Overview tab, but
                always visible next to the date chip so it's easy to find. ── */}
            {activeSection === "overview" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#f8fafc",
                  border: "1px solid #eef1f6",
                  borderRadius: "999px",
                  padding: "4px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOverviewDate((d) => shiftDate(d, -1))}
                  title="Previous day"
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    color: "#475569",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>

                <span
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11.5px",
                      fontWeight: 700,
                      color: "#0e7490",
                      background: "#ecfeff",
                      padding: "3px 8px",
                      borderRadius: "999px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {overviewDateLabel(overviewDate)}
                  </span>
                  <input
                    type="date"
                    value={overviewDate}
                    onChange={(e) => setOverviewDate(e.target.value || TODAY)}
                    style={{
                      border: "1px solid #e2e8f0",
                      background: "#ffffff",
                      borderRadius: "8px",
                      padding: "5px 8px",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      color: "#0f172a",
                      cursor: "pointer",
                      outline: "none",
                    }}
                    title="Pick any date from the calendar"
                  />
                </span>

                <button
                  type="button"
                  onClick={() => setOverviewDate((d) => shiftDate(d, 1))}
                  title="Next day"
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    color: "#475569",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>

                {overviewDate !== TODAY && (
                  <button
                    type="button"
                    onClick={() => setOverviewDate(TODAY)}
                    style={{
                      border: "none",
                      background: "#ecfeff",
                      color: "#0e7490",
                      padding: "5px 10px",
                      fontSize: "11px",
                      fontWeight: 700,
                      borderRadius: "999px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Today
                  </button>
                )}
              </div>
            )}

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
            <div className={styles.photographerPill}>
              <span className={styles.pillDot} />
              Photographer
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
          {loading && (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p>Loading your tasks...</p>
            </div>
          )}

          {!loading && error && (
            <div className={styles.errorState}>
              <span>⚠️ {error}</span>
              <button onClick={loadAll}>Retry</button>
            </div>
          )}

          {!loading && !error && (
            <>
              {activeSection === "overview" && (
                <>
                  <PhotoStatsCards
                    todayShoots={overviewShoots.length}
                    todayShootsCompleted={overviewShootsCompleted}
                    todayEdits={overviewEdits.length}
                    todayEditsCompleted={overviewEditsCompleted}
                    additionalPending={additionalPending}
                  />
                  <div className={styles.overviewGrid}>
                    <div>
                      <ShootsBoard
                        shoots={overviewShootsPage.pageItems}
                        onStatusChange={handleShootStatusChange}
                        onResubmit={handleResubmit}
                      />
                      <Pagination
                        page={overviewShootsPage.safePage}
                        totalPages={overviewShootsPage.totalPages}
                        totalItems={overviewShoots.length}
                        onPrev={() => setPage("overviewShoots", overviewShootsPage.safePage - 1)}
                        onNext={() => setPage("overviewShoots", overviewShootsPage.safePage + 1)}
                      />
                    </div>
                    <div>
                      <EditsBoard
                        edits={overviewEditsPage.pageItems}
                        onProgressChange={handleEditProgressChange}
                        onResubmit={handleResubmit}
                      />
                      <Pagination
                        page={overviewEditsPage.safePage}
                        totalPages={overviewEditsPage.totalPages}
                        totalItems={overviewEdits.length}
                        onPrev={() => setPage("overviewEdits", overviewEditsPage.safePage - 1)}
                        onNext={() => setPage("overviewEdits", overviewEditsPage.safePage + 1)}
                      />
                    </div>
                  </div>
                </>
              )}

              {activeSection === "shoots" && (
                <>
                  <ShootsBoard shoots={shootsPage.pageItems} onStatusChange={handleShootStatusChange} onResubmit={handleResubmit} />
                  <Pagination
                    page={shootsPage.safePage}
                    totalPages={shootsPage.totalPages}
                    totalItems={shoots.length}
                    onPrev={() => setPage("shoots", shootsPage.safePage - 1)}
                    onNext={() => setPage("shoots", shootsPage.safePage + 1)}
                  />
                </>
              )}

              {activeSection === "edits" && (
                <>
                  <EditsBoard edits={editsPage.pageItems} onProgressChange={handleEditProgressChange} onResubmit={handleResubmit} />
                  <Pagination
                    page={editsPage.safePage}
                    totalPages={editsPage.totalPages}
                    totalItems={edits.length}
                    onPrev={() => setPage("edits", editsPage.safePage - 1)}
                    onNext={() => setPage("edits", editsPage.safePage + 1)}
                  />
                </>
              )}

              {activeSection === "additional" && (
                <>
                  <AdditionalWorkBoard
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
            </>
          )}
        </div>
      </main>
    </div>
  );
}