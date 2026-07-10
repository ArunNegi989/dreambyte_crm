// ── SMM (Social Media Manager) Dashboard: Types + Helpers ──────────────────
// No mock data anywhere. Everything comes from the SAME backend Task model
// your Super Admin dashboard already uses (via app/api/smmApi.ts).
//
// The dashboard splits the one Task collection into two views:
//   1. "General tasks"  → taskType is anything OTHER than post/video/story
//                          (scripting, ugc, references, pitch_deck, ...)
//   2. "Posting entries" → taskType is "post" | "video" | "story"
//                          (shown in the brand-by-brand Posting Tracker)
//
// If your department's "Work Type" dropdown (SATasks → departmentTasks.ts)
// uses different labels for post/video/story content, just update
// CONTENT_TYPE_KEYS below to match.

export type TaskType = string;
export type ContentType = "post" | "video" | "story";
export type Frequency = "weekly" | "monthly" | "one_time";

export type TaskStatus =
  | "pending"
  | "in_progress"
  | "completed" // employee submitted — awaiting Super Admin review
  | "approved" // Super Admin approved
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

// One shape for every backend Task document.
export interface RawTask {
  _id: string;
  title: string;
  description: string;
  brandId?: string | BrandRef | null;
  taskType: TaskType;
  frequency: Frequency;
  dueDate: string; // used as "the date" for posting entries too
  status: TaskStatus;
  assignedBy: "admin" | "super_admin";
  deliveryStatus: DeliveryStatus;
  deliveryNote?: string;
  startedAt?: string | null;
  deliveredAt?: string | null;
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

// ── Which taskType values route into the Posting Tracker ───────────────────
export const CONTENT_TYPE_KEYS: ContentType[] = ["post", "video", "story"];

export const isPostingEntry = (t: RawTask) =>
  CONTENT_TYPE_KEYS.includes((t.taskType || "").toLowerCase() as ContentType);

// ── Presentation metadata ──────────────────────────────────────────────────
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

// ── Helpers ──────────────────────────────────────────────────────────────
export const todayStr = () => new Date().toISOString().split("T")[0];

export const getBrandName = (brandId?: string | BrandRef | null) => {
  if (!brandId) return "—";
  if (typeof brandId === "object") return brandId.name;
  return "—";
};

// Deterministic color per brand name — so any brand the Super Admin creates
// gets a consistent color without needing a manual color map.
const PALETTE = ["#f59e0b", "#6366f1", "#ec4899", "#10b981", "#0ea5e9", "#a855f7", "#ef4444", "#14b8a6"];
export const colorForBrand = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
};

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