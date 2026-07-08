"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  fetchMyAdditionalWork,
  createAdditionalWork,
  updateAdditionalWorkStatus,
} from "@/types/photography/Photo";
import styles from "@/app/dashboard/photographydashboard/Photographerdashboard.module.css";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function PhotographerDashboard() {
  useAuthGuard(['employee', 'admin', 'super_admin'], ['photography']); // ⚠️ confirm matches DB value
  const [activeSection, setActiveSectionState] = useState<PhotoSection>("overview");

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

  // ── Current logged-in photographer's id ────────────────────────────────
  // Adjust if your login flow stores the user differently.
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

  // ── Real backend data ───────────────────────────────────────────────────
  const [rawTasks, setRawTasks] = useState<RawTask[]>([]);
  const [additionalWork, setAdditionalWork] = useState<AdditionalWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // ── Derived stats ────────────────────────────────────────────────────
  const todayShoots = shoots.filter((s) => s.date === TODAY);
  const todayShootsCompleted = todayShoots.filter((s) => s.status === "completed").length;

  const todayEdits = edits.filter((e) => e.date === TODAY || e.deadline === TODAY);
  const todayEditsCompleted = todayEdits.filter((e) => e.status === "completed").length;

  const pendingShoots = shoots.filter((s) => s.status !== "completed").length;
  const pendingEdits = edits.filter((e) => e.status !== "completed").length;
  const additionalPending = additionalWork.filter((w) => w.status !== "completed").length;

  const sectionMeta: Record<PhotoSection, { title: string; sub: string }> = {
    overview: { title: "Today's Overview", sub: "Your shoots, edits, and extra work at a glance" },
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
                    todayShoots={todayShoots.length}
                    todayShootsCompleted={todayShootsCompleted}
                    todayEdits={todayEdits.length}
                    todayEditsCompleted={todayEditsCompleted}
                    additionalPending={additionalPending}
                  />
                  <div className={styles.overviewGrid}>
                    <ShootsBoard
                      shoots={shoots.filter((s) => s.date === TODAY)}
                      onStatusChange={handleShootStatusChange}
                    />
                    <EditsBoard
                      edits={edits.filter((e) => e.date === TODAY || e.deadline === TODAY)}
                      onProgressChange={handleEditProgressChange}
                    />
                  </div>
                </>
              )}

              {activeSection === "shoots" && (
                <ShootsBoard shoots={shoots} onStatusChange={handleShootStatusChange} />
              )}

              {activeSection === "edits" && (
                <EditsBoard edits={edits} onProgressChange={handleEditProgressChange} />
              )}

              {activeSection === "additional" && (
                <AdditionalWorkBoard
                  items={additionalWork}
                  onStatusChange={handleAdditionalStatusChange}
                  onAddItem={handleAddAdditionalWork}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}