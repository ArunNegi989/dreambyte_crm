"use client";

import { useEffect, useMemo, useState } from "react";
import PhotoSidebar, { PhotoSection } from "@/components/dashboard/photographerdashboard/Photosidebar";
import PhotoStatsCards from "@/components/dashboard/photographerdashboard/Photostatscards";
import ShootsBoard from "@/components/dashboard/photographerdashboard/Shootsboard";
import EditsBoard from "@/components/dashboard/photographerdashboard/Editsboard";
import AdditionalWorkBoard from "@/components/dashboard/photographerdashboard/Additionalwork";
import {
  mockShoots,
  mockEdits,
  mockAdditionalWork,
  Shoot,
  EditTask,
  AdditionalWork,
  WorkStatus,
  TODAY,
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

  // ── Static (mock) data, held in state so the UI is interactive ────────
  // Swap these useState initializers for API-loaded data later — everything
  // downstream (handlers, components) already expects this exact shape.
  const [shoots, setShoots] = useState<Shoot[]>(mockShoots);
  const [edits, setEdits] = useState<EditTask[]>(mockEdits);
  const [additionalWork, setAdditionalWork] = useState<AdditionalWork[]>(mockAdditionalWork);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleShootStatusChange = (id: string, status: WorkStatus) => {
    setShoots((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const handleEditProgressChange = (id: string, completedCount: number) => {
    setEdits((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const status: WorkStatus =
          completedCount >= e.totalCount ? "completed" : completedCount > 0 ? "in_progress" : "pending";
        return { ...e, completedCount, status };
      })
    );
  };

  const handleAdditionalStatusChange = (id: string, status: WorkStatus) => {
    setAdditionalWork((prev) => prev.map((w) => (w.id === id ? { ...w, status } : w)));
  };

  const handleAddAdditionalWork = (title: string, description: string) => {
    const entry: AdditionalWork = {
      id: `aw_${Date.now()}`,
      title,
      description,
      date: TODAY,
      status: "pending",
      loggedBy: "self",
    };
    setAdditionalWork((prev) => [entry, ...prev]);
  };

  // ── Derived stats ────────────────────────────────────────────────────
  const todayShoots = useMemo(() => shoots.filter((s) => s.date === TODAY), [shoots]);
  const todayShootsCompleted = todayShoots.filter((s) => s.status === "completed").length;

  const todayEdits = useMemo(() => edits.filter((e) => e.date === TODAY || e.deadline === TODAY), [edits]);
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
        </div>
      </main>
    </div>
  );
}