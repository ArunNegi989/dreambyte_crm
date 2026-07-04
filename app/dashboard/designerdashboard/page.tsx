"use client";

import { useEffect, useMemo, useState } from "react";
import DesignerSidebar, { DesignerSection } from "@/components/dashboard/designerdashboard/Designersidebar";
import DesignerStatsCards from "@/components/dashboard/designerdashboard/Designerstatscards";
import DesignerTasksBoard from "@/components/dashboard/designerdashboard/Designertasksboard";
import DesignerAdditionalWork from "@/components/dashboard/designerdashboard/Designeradditionalwork";
import DesignerHistory from "@/components/dashboard/designerdashboard/Designerhistory";
import {
  mockTasks,
  mockAdditionalWork,
  DesignTask,
  AdditionalWork,
  TaskStatus,
  TODAY,
} from "@/types/designer/Designer";
import styles from "@/public/assets/styles/dashboard/designerdashboard/Designerdashboard.module.css";

export default function DesignerDashboard() {
  const [activeSection, setActiveSectionState] = useState<DesignerSection>("overview");

  // ── Persist active tab across refresh ──────────────────────────────────
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

  // ── Static (mock) data, held in state so the UI is interactive ────────
  // Swap these initializers for API-loaded data later.
  const [tasks, setTasks] = useState<DesignTask[]>(mockTasks);
  const [additionalWork, setAdditionalWork] = useState<AdditionalWork[]>(mockAdditionalWork);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleStatusChange = (id: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status, completedAt: status === "completed" ? new Date().toISOString().split("T")[0] : t.completedAt }
          : t
      )
    );
  };

  const handleReplyToChange = (taskId: string, changeId: string, response: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          changes: t.changes.map((c) =>
            c.id === changeId ? { ...c, designerResponse: response, resolved: true } : c
          ),
        };
      })
    );
  };

  const handleAdditionalStatusChange = (id: string, status: "pending" | "completed") => {
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
  const todayTasks = useMemo(() => tasks.filter((t) => t.dueDate === TODAY), [tasks]);
  const todayCompleted = todayTasks.filter((t) => t.status === "completed").length;

  const needsAttention = tasks.filter(
    (t) => t.status === "rejected" || t.status === "changes_requested"
  ).length;

  const pendingTasks = tasks.filter(
    (t) => t.status === "pending" || t.status === "in_progress"
  ).length;

  const monthStr = TODAY.slice(0, 7);
  const completedThisMonth = tasks.filter(
    (t) => t.status === "completed" && (t.completedAt ?? t.dueDate).startsWith(monthStr)
  ).length;

  const additionalPending = additionalWork.filter((w) => w.status !== "completed").length;

  const completedTasks = useMemo(() => tasks.filter((t) => t.status === "completed"), [tasks]);

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
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>
            <div className={styles.designerPill}>
              <span className={styles.pillDot} />
              Designer
            </div>
          </div>
        </div>

        <div className={styles.content}>
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
                tasks={todayTasks}
                onStatusChange={handleStatusChange}
                onReplyToChange={handleReplyToChange}
                showFilters={false}
                title="Today's Tasks"
                subtitle="Everything due today across all task types"
              />
            </>
          )}

          {activeSection === "tasks" && (
            <DesignerTasksBoard
              tasks={tasks}
              onStatusChange={handleStatusChange}
              onReplyToChange={handleReplyToChange}
            />
          )}

          {activeSection === "additional" && (
            <DesignerAdditionalWork
              items={additionalWork}
              onStatusChange={handleAdditionalStatusChange}
              onAddItem={handleAddAdditionalWork}
            />
          )}

          {activeSection === "history" && <DesignerHistory tasks={completedTasks} />}
        </div>
      </main>
    </div>
  );
}