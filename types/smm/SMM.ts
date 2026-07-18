// ── SMM (Social Media Manager) Dashboard: Types + Helpers ──────────────────
export type TaskType = string;
export type ContentType = "post" | "video" | "story";
export type Frequency = "weekly" | "monthly" | "one_time";

export type TaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "approved"
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

export interface RawTask {
  _id: string;
  title: string;
  description: string;
  brandId?: string | BrandRef | null;
  taskType: TaskType;
  frequency: Frequency;
  dueDate: string;
  status: TaskStatus;
  assignedBy: "admin" | "super_admin";
  deliveryStatus: DeliveryStatus;
  deliveryNote?: string;
  startedAt?: string | null;
  deliveredAt?: string | null;
  // ── Time tracking ──────────────────────────────────────────────────
  // timeSpentMs: cumulative worked time across all sessions, pause-aware
  // (accumulated server-side every time a session stops — submit, respond,
  // deliver, or a fresh rejection). currentSessionStartedAt: set while a
  // session is actively running (Start/Resume), null while paused/delivered.
  // Together these are THE source of truth for "time taken" — see
  // getTimeTakenLabel below. startedAt/deliveredAt are display-only
  // timestamps and must NOT be used to compute elapsed time; deliveredAt
  // in particular gets cleared on Resume, so a startedAt -> deliveredAt
  // diff silently breaks after any reject -> resume cycle.
  timeSpentMs?: number;
  currentSessionStartedAt?: string | null;
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

export const CONTENT_TYPE_KEYS: ContentType[] = ["post", "video", "story"];

export const isPostingEntry = (t: RawTask) =>
  CONTENT_TYPE_KEYS.includes((t.taskType || "").toLowerCase() as ContentType);

export const TASK_TYPE_META: Record<string, { label: string; bg: string; color: string }> = {
  scripting: { label: "Scripting", bg: "#ecfeff", color: "#0e7490" },
  ugc: { label: "UGC", bg: "#fdf4ff", color: "#a21caf" },
  references: { label: "References", bg: "#f1f5f9", color: "#334155" },
  pitch_deck: { label: "Pitch Deck", bg: "#eef2ff", color: "#4338ca" },
  market_research: { label: "Market Research", bg: "#fff7ed", color: "#c2410c" },
  content_calendar: { label: "Content Calendar", bg: "#f0fdf4", color: "#15803d" },
};

export const getTaskTypeMeta = (t: string) =>
  TASK_TYPE_META[t] ?? { label: t || "Task", bg: "#f1f5f9", color: "#334155" };

export const CONTENT_TYPE_META: Record<ContentType, { label: string; bg: string; color: string; icon: string }> = {
  post: { label: "Post", bg: "#eef2ff", color: "#4338ca", icon: "🖼️" },
  video: { label: "Video", bg: "#fdf2f8", color: "#be185d", icon: "🎬" },
  story: { label: "Story", bg: "#fefce8", color: "#a16207", icon: "⚡" },
};

export const FREQUENCY_META: Record<Frequency, { label: string; bg: string; color: string }> = {
  weekly: { label: "Weekly", bg: "#f5f3ff", color: "#7c3aed" },
  monthly: { label: "Monthly", bg: "#fdf2f8", color: "#be185d" },
  one_time: { label: "One Time", bg: "#f0fdf4", color: "#15803d" },
};

export const todayStr = () => new Date().toISOString().split("T")[0];

export const getBrandName = (brandId?: string | BrandRef | null) => {
  if (!brandId) return "—";
  if (typeof brandId === "object") return brandId.name;
  return "—";
};

const PALETTE = ["#f59e0b", "#6366f1", "#ec4899", "#10b981", "#0ea5e9", "#a855f7", "#ef4444", "#14b8a6"];
export const colorForBrand = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
};

// ── Time-taken helper ────────────────────────────────────────────────────
// THE FIX: this was briefly reverted to a raw startedAt -> deliveredAt
// wall-clock diff (the comment here used to claim that matched the Super
// Admin panel — it did, until that shared bug was found and fixed
// everywhere: SATasks, Tasktable, AdminSelfTasksBoard, Designer Dashboard).
// That diff formula breaks the moment a task goes through a
// reject -> Resume cycle: the backend's startTask() intentionally clears
// deliveredAt on resume (so the OLD delivered timestamp doesn't get read
// as an "end"), which means the diff falls back to (now - startedAt) — the
// task's ORIGINAL start time, potentially days ago, ignoring any time
// spent paused waiting on the rejection.
//
// The backend already tracks the correct, pause-aware total in
// timeSpentMs (accumulated on every stopTimer() call) plus whatever the
// currently-running session has added on top (currentSessionStartedAt).
// Every other dashboard uses this formula now — SMM needs to match.
export const getTimeTakenLabel = (
  timeSpentMs?: number | null,
  currentSessionStartedAt?: string | null
): string | null => {
  let totalMs = timeSpentMs || 0;

  if (currentSessionStartedAt) {
    const elapsed = Date.now() - new Date(currentSessionStartedAt).getTime();
    if (elapsed > 0) totalMs += elapsed;
  }

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