// ── Graphic Designer Dashboard: Types + Helpers ─────────────────────────────
// Everything here now mirrors the backend Task / AdditionalWork models
// exactly — there is NO mock data. Real data always comes from
// app/api/designerApi.ts, which hits your existing /api/tasks and
// /api/additional-work routes (same Task model the Super Admin dashboard
// already uses).

export type TaskType = string; // free-text, driven by the department's work-type dropdown (e.g. "post", "story"…)

export type Frequency = "weekly" | "monthly" | "one_time";

export type TaskStatus =
  | "pending"
  | "in_progress"
  | "completed" // employee has submitted — awaiting Super Admin review
  | "approved" // Super Admin has approved
  | "rejected"
  | "changes_requested";

export type DeliveryStatus = "delivered" | "not_delivered";

export interface ChangeLogEntry {
  _id: string;
  changedBy: string;
  note: string;
  changedAt: string;
  resolved: boolean;
  employeeResponse?: string;
}

export interface BrandRef {
  _id: string;
  name: string;
}

export interface DesignTask {
  _id: string;
  title: string;
  description: string;
  brandId?: string | BrandRef | null;
  taskType: TaskType;
  frequency: Frequency;
  dueDate: string; // YYYY-MM-DD
  status: TaskStatus;
  assignedBy: "admin" | "super_admin";
  deliveryStatus: DeliveryStatus;
  deliveryNote?: string;
  startedAt?: string | null; // ISO — stamped the moment the employee first starts work (legacy/display)
  deliveredAt?: string | null; // ISO — stamped on every (re)submission
  // ── Time tracking (pause/resume aware) ──────────────────────────────────
  timeSpentMs?: number; // cumulative worked time across all start/resume sessions
  currentSessionStartedAt?: string | null; // ISO — set while the clock is actively running, else null
  rejectRemark?: string;
  changes: ChangeLogEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface AdditionalWork {
  _id: string;
  title: string;
  description: string;
  date: string;
  status: "pending" | "completed";
  loggedBy: "self" | "admin";
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
}

// ── Presentation metadata for known task types (falls back gracefully for
// any new work-type string the Super Admin's dropdown might send) ──────────
export const TASK_TYPE_META: Record<string, { label: string; bg: string; color: string }> = {
  post: { label: "Social Post", bg: "#eef2ff", color: "#4338ca" },
  story: { label: "Story", bg: "#fdf2f8", color: "#be185d" },
  packaging: { label: "Packaging", bg: "#fff7ed", color: "#c2410c" },
  menu: { label: "Menu Design", bg: "#f0fdf4", color: "#15803d" },
  reel_create: { label: "Reel (Create)", bg: "#fef9c3", color: "#a16207" },
  reel_edit: { label: "Reel (Edit)", bg: "#fae8ff", color: "#a21caf" },
  video_edit: { label: "Video Edit", bg: "#e0f2fe", color: "#0369a1" },
  news_edit: { label: "News Edit", bg: "#f1f5f9", color: "#334155" },
  pdf: { label: "PDF Design", bg: "#fef2f2", color: "#b91c1c" },
  ppt: { label: "PPT Design", bg: "#ecfeff", color: "#0e7490" },
  portfolio: { label: "Portfolio", bg: "#f5f3ff", color: "#6d28d9" },
};

export const getTaskTypeMeta = (t: string) =>
  TASK_TYPE_META[t] ?? { label: t || "Task", bg: "#f1f5f9", color: "#334155" };

export const FREQUENCY_META: Record<Frequency, { label: string; bg: string; color: string }> = {
  weekly: { label: "Weekly", bg: "#f5f3ff", color: "#7c3aed" },
  monthly: { label: "Monthly", bg: "#fdf2f8", color: "#be185d" },
  one_time: { label: "One Time", bg: "#f0fdf4", color: "#15803d" },
};

// ── Helpers ──────────────────────────────────────────────────────────────
export const todayStr = () => new Date().toISOString().split("T")[0];

export const getBrandName = (brandId?: string | BrandRef | null) => {
  if (!brandId) return "—";
  if (typeof brandId === "object") return brandId.name;
  return "—";
};

/**
 * Human readable cumulative "time taken", pause/resume aware.
 *
 * `timeSpentMs` is the total time already banked across every completed
 * start/resume session. `currentSessionStartedAt` is set only while the
 * clock is actively running (after Start/Resume, before the next Submit) —
 * when present, the live elapsed time since that timestamp is added on top
 * so the number visibly keeps ticking up while the employee is working.
 */
export const getTimeTakenLabel = (
  timeSpentMs?: number | null,
  currentSessionStartedAt?: string | null
): string | null => {
  const base = timeSpentMs || 0;
  const live = currentSessionStartedAt
    ? Math.max(0, Date.now() - new Date(currentSessionStartedAt).getTime())
    : 0;
  const totalMs = base + live;
  if (totalMs <= 0) return null;

  const totalMinutes = Math.floor(totalMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const days = Math.floor(hours / 24);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return "<1m";
};