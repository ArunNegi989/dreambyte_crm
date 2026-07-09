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
  startedAt?: string | null; // ISO — stamped the moment the employee starts work
  deliveredAt?: string | null; // ISO — stamped on every (re)submission
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
 * Human readable "time taken" between startedAt and deliveredAt.
 * If the task hasn't been delivered yet, measures up to "now" so the
 * clock visibly keeps running while the employee is still working.
 */
export const getTimeTakenLabel = (
  startedAt?: string | null,
  deliveredAt?: string | null
): string | null => {
  if (!startedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = deliveredAt ? new Date(deliveredAt).getTime() : Date.now();
  let diffMs = end - start;
  if (diffMs < 0) diffMs = 0;

  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  if (days > 0) return `${days}d ${hrs % 24}h`;
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  return `${mins}m`;
};