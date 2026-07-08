"use client";

import { useEffect, useMemo, useState } from "react";
import SMMSidebar, { SMMSection } from "@/components/dashboard/smmdashboardcomponents/Smmsidebar";
import SMMStatsCards from "@/components/dashboard/smmdashboardcomponents/Smmstatscards";
import SMMTasksBoard from "@/components/dashboard/smmdashboardcomponents/Smmtasksboard";
import PostingBoard from "@/components/dashboard/smmdashboardcomponents/Postingboard";
import SMMAdditionalWork from "@/components/dashboard/smmdashboardcomponents/Smmadditionalwork";
import SMMHistory from "@/components/dashboard/smmdashboardcomponents/Smmhistory";
import {
  mockTasks,
  mockPostingEntries,
  mockAdditionalWork,
  SMMTask,
  PostingEntry,
  AdditionalWork,
  TaskStatus,
  TODAY,
} from "@/types/smm/SMM";
import styles from "@/app/dashboard/smmdashboard/smmdashboard.module.css";
import { useAuthGuard } from "@/hooks/useAuthGuard";
export default function SMMDashboard() {
  const [activeSection, setActiveSectionState] = useState<SMMSection>("overview");
  useAuthGuard(['employee', 'admin', 'super_admin'], ['smm']); // ⚠️ confirm matches DB value
  // ── Persist active tab across refresh ──────────────────────────────────
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

  // ── Static (mock) data, held in state so the UI is interactive ────────
  // Swap these initializers for API-loaded data later.
  const [tasks, setTasks] = useState<SMMTask[]>(mockTasks);
  const [postingEntries, setPostingEntries] = useState<PostingEntry[]>(mockPostingEntries);
  const [additionalWork, setAdditionalWork] = useState<AdditionalWork[]>(mockAdditionalWork);

  // ── Task handlers ───────────────────────────────────────────────────
  const handleTaskStatusChange = (id: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status, completedAt: status === "completed" ? new Date().toISOString().split("T")[0] : t.completedAt }
          : t
      )
    );
  };

  const handleTaskReply = (taskId: string, changeId: string, response: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          changes: t.changes.map((c) => (c.id === changeId ? { ...c, smmResponse: response, resolved: true } : c)),
        };
      })
    );
  };

  // ── Posting handlers ────────────────────────────────────────────────
  const handlePostingStatusChange = (id: string, status: TaskStatus) => {
    setPostingEntries((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  };

  const handlePostingReply = (entryId: string, changeId: string, response: string) => {
    setPostingEntries((prev) =>
      prev.map((p) => {
        if (p.id !== entryId) return p;
        return {
          ...p,
          changes: p.changes.map((c) => (c.id === changeId ? { ...c, smmResponse: response, resolved: true } : c)),
        };
      })
    );
  };

  // ── Additional work handlers ────────────────────────────────────────
  const handleAdditionalStatusChange = (id: string, status: "pending" | "completed") => {
    setAdditionalWork((prev) => prev.map((w) => (w.id === id ? { ...w, status } : w)));
  };

  const handleAddAdditionalWork = (title: string, description: string) => {
    const entry: AdditionalWork = {
      id: `smaw_${Date.now()}`,
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

  const todayPosting = useMemo(() => postingEntries.filter((p) => p.date === TODAY), [postingEntries]);
  const todayPostingCompleted = todayPosting.filter((p) => p.status === "completed").length;

  const needsAttention =
    tasks.filter((t) => t.status === "rejected" || t.status === "changes_requested").length +
    postingEntries.filter((p) => p.status === "rejected" || p.status === "changes_requested").length;

  const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length;

  const additionalPending = additionalWork.filter((w) => w.status !== "completed").length;

  const completedTasks = useMemo(() => tasks.filter((t) => t.status === "completed"), [tasks]);
  const completedPosting = useMemo(() => postingEntries.filter((p) => p.status === "completed"), [postingEntries]);

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
          </div>
        </div>

        <div className={styles.content}>
          {activeSection === "overview" && (
            <>
              <SMMStatsCards
                todayTasks={todayTasks.length}
                todayCompleted={todayCompleted}
                todayPosting={todayPosting.length}
                todayPostingCompleted={todayPostingCompleted}
                needsAttention={needsAttention}
                additionalPending={additionalPending}
              />
              <SMMTasksBoard
                tasks={todayTasks}
                onStatusChange={handleTaskStatusChange}
                onReplyToChange={handleTaskReply}
                showFilters={false}
                title="Today's Tasks"
                subtitle="Everything due today across scripting, UGC, research and more"
              />
            </>
          )}

          {activeSection === "tasks" && (
            <SMMTasksBoard
              tasks={tasks}
              onStatusChange={handleTaskStatusChange}
              onReplyToChange={handleTaskReply}
            />
          )}

          {activeSection === "posting" && (
            <PostingBoard
              entries={postingEntries}
              onStatusChange={handlePostingStatusChange}
              onReplyToChange={handlePostingReply}
            />
          )}

          {activeSection === "additional" && (
            <SMMAdditionalWork
              items={additionalWork}
              onStatusChange={handleAdditionalStatusChange}
              onAddItem={handleAddAdditionalWork}
            />
          )}

          {activeSection === "history" && (
            <SMMHistory completedTasks={completedTasks} completedPosting={completedPosting} />
          )}
        </div>
      </main>
    </div>
  );
}