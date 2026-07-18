// ── Photographer Dashboard: Real Backend-Driven Types ──────────────────────
import api from "@/lib/api";

export type WorkStatus = "pending" | "in_progress" | "completed" | "approved" | "rejected";
export type MediaType = "photo" | "video" | "both";

export interface RawTaskChange {
  _id: string;
  changedBy: string;
  note: string;
  changedAt: string;
  resolved: boolean;
  employeeResponse?: string;
}

export interface RawTask {
  _id: string;
  title: string;
  description: string;
  assignedTo: string | { _id: string; name: string };
  assignedBy: "admin" | "super_admin";
  brandId?: string | { _id: string; name: string } | null;
  frequency: string;
  dueDate: string;
  status: string;
  taskType?: string;
  location?: string;
  time?: string;
  mediaType?: MediaType | null;
  totalCount?: number | null;
  completedCount?: number;
  createdAt?: string;
  updatedAt?: string;
  rejectRemark?: string;
  changes?: RawTaskChange[];
  // ── Time tracking ──────────────────────────────────────────────────────
  startedAt?: string | null;
  deliveredAt?: string | null;
  timeSpentMs?: number;
  currentSessionStartedAt?: string | null;
}

export interface RawAdditionalWork {
  _id: string;
  title: string;
  description: string;
  date: string;
  status: "pending" | "completed";
  loggedBy: "self" | "admin";
  assignedTo: string;
}

export interface TaskChangeNote {
  id: string;
  note: string;
  changedBy: string;
  changedAt: string;
  resolved: boolean;
  employeeResponse?: string;
}

export interface Shoot {
  id: string;
  brand: string;
  brandColor: string;
  title: string;
  location: string;
  date: string;
  time: string;
  type: MediaType;
  status: WorkStatus;
  assignedBy: string;
  notes?: string;
  rejectRemark?: string;
  openChange?: TaskChangeNote;
  changes: TaskChangeNote[];
  // ── Time tracking ──────────────────────────────────────────────────────
  startedAt: string | null;
  deliveredAt: string | null;
  timeSpentMs: number;
  currentSessionStartedAt: string | null;
}

export interface EditTask {
  id: string;
  brand: string;
  brandColor: string;
  title: string;
  mediaType: "photo" | "video";
  totalCount: number;
  completedCount: number;
  date: string;
  deadline: string;
  status: WorkStatus;
  assignedBy: string;
  rejectRemark?: string;
  openChange?: TaskChangeNote;
  changes: TaskChangeNote[];
  // ── Time tracking ──────────────────────────────────────────────────────
  startedAt: string | null;
  deliveredAt: string | null;
  timeSpentMs: number;
  currentSessionStartedAt: string | null;
}

export interface AdditionalWork {
  id: string;
  title: string;
  description: string;
  date: string;
  status: WorkStatus;
  loggedBy: "self" | "admin";
}

export const TODAY = new Date().toISOString().split("T")[0];

const BRAND_PALETTE = ["#f59e0b", "#6366f1", "#ec4899", "#10b981", "#0ea5e9", "#a855f7", "#ef4444"];
const brandColorFromName = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return BRAND_PALETTE[Math.abs(hash) % BRAND_PALETTE.length];
};

const getBrandName = (brandId?: string | { _id: string; name: string } | null): string =>
  brandId && typeof brandId === "object" ? brandId.name : "—";

const getAssignedByLabel = (assignedBy: "admin" | "super_admin"): string =>
  assignedBy === "super_admin" ? "Super Admin" : "Admin";

const toWorkStatus = (status: string): WorkStatus => {
  if (status === "approved") return "approved";
  if (status === "completed") return "completed";
  if (status === "in_progress") return "in_progress";
  if (status === "rejected" || status === "changes_requested") return "rejected";
  return "pending";
};

const getOpenChange = (changes?: RawTaskChange[]): TaskChangeNote | undefined => {
  if (!changes || changes.length === 0) return undefined;
  const unresolved = changes.filter((c) => !c.resolved);
  if (unresolved.length === 0) return undefined;
  const last = unresolved[unresolved.length - 1];
  return {
    id: last._id,
    note: last.note,
    changedBy: last.changedBy,
    changedAt: last.changedAt,
    resolved: last.resolved,
    employeeResponse: last.employeeResponse,
  };
};

const mapChangeHistory = (changes?: RawTaskChange[]): TaskChangeNote[] => {
  if (!changes || changes.length === 0) return [];
  return changes.map((c) => ({
    id: c._id,
    note: c.note,
    changedBy: c.changedBy,
    changedAt: c.changedAt,
    resolved: c.resolved,
    employeeResponse: c.employeeResponse,
  }));
};

export const isShootTask = (t: RawTask) => t.taskType === "Shoots";
export const isEditTask = (t: RawTask) => t.taskType === "Photo Edit" || t.taskType === "Video Edit";

export const mapToShoot = (t: RawTask): Shoot => {
  const brandName = getBrandName(t.brandId);
  return {
    id: t._id,
    brand: brandName,
    brandColor: brandColorFromName(brandName),
    title: t.title,
    location: t.location || "—",
    date: t.dueDate,
    time: t.time || "—",
    type: t.mediaType || "photo",
    status: toWorkStatus(t.status),
    assignedBy: getAssignedByLabel(t.assignedBy),
    notes: t.description || undefined,
    rejectRemark: t.rejectRemark || undefined,
    openChange: getOpenChange(t.changes),
    changes: mapChangeHistory(t.changes),
    startedAt: t.startedAt || null,
    deliveredAt: t.deliveredAt || null,
    timeSpentMs: t.timeSpentMs || 0,
    currentSessionStartedAt: t.currentSessionStartedAt || null,
  };
};

export const mapToEditTask = (t: RawTask): EditTask => {
  const brandName = getBrandName(t.brandId);
  return {
    id: t._id,
    brand: brandName,
    brandColor: brandColorFromName(brandName),
    title: t.title,
    mediaType: t.taskType === "Video Edit" ? "video" : "photo",
    totalCount: t.totalCount ?? 1,
    completedCount: t.completedCount ?? 0,
    date: t.createdAt ? t.createdAt.split("T")[0] : t.dueDate,
    deadline: t.dueDate,
    status: toWorkStatus(t.status),
    assignedBy: getAssignedByLabel(t.assignedBy),
    rejectRemark: t.rejectRemark || undefined,
    openChange: getOpenChange(t.changes),
    changes: mapChangeHistory(t.changes),
    startedAt: t.startedAt || null,
    deliveredAt: t.deliveredAt || null,
    timeSpentMs: t.timeSpentMs || 0,
    currentSessionStartedAt: t.currentSessionStartedAt || null,
  };
};

export const mapToAdditionalWork = (w: RawAdditionalWork): AdditionalWork => ({
  id: w._id,
  title: w.title,
  description: w.description,
  date: w.date,
  status: w.status,
  loggedBy: w.loggedBy,
});

// ── Time-taken helper ────────────────────────────────────────────────────
// THE FIX: this used to compute a raw startedAt -> deliveredAt wall-clock
// diff. That formula quietly breaks the moment a task goes through a
// reject -> Resume Task cycle: startOrResumeTask() intentionally leaves
// deliveredAt cleared on resume (so the OLD delivered timestamp doesn't
// get treated as an "end"), which means this diff falls back to
// (now - startedAt) — the task's ORIGINAL start time, potentially days
// ago — completely ignoring any time it spent paused while waiting on the
// rejection. The number balloons and looks like a runaway/broken timer.
//
// The backend already tracks the correct, pause-aware total in
// timeSpentMs (accumulated on every stopTimer() call) plus whatever the
// currently-running session has added on top (currentSessionStartedAt).
// This is the exact same formula the Super Admin dashboard (SATasks.tsx)
// and the Designer Dashboard use, so all sides now always show the
// identical number, in every state (running, paused on rejection,
// resumed, delivered).
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

export const fetchMyTasks = async (employeeId: string): Promise<RawTask[]> => {
  const res = await api.get(`/tasks?assignedTo=${employeeId}`);
  return res.data.data;
};

// ── Start / Resume — generic /start endpoint. pending -> in_progress
// (fresh start, backend stamps startedAt + currentSessionStartedAt).
// rejected -> status untouched, just restarts the timer session (resume).
export const startOrResumeTask = async (taskId: string): Promise<RawTask> => {
  const res = await api.post(`/tasks/${taskId}/start`, {});
  return res.data.data;
};

// ── Submit for review — employee writes a note, backend stops the clock
// and flips status to "completed" (awaiting admin review).
export const submitTaskForReview = async (taskId: string, note: string): Promise<RawTask> => {
  const res = await api.post(`/tasks/${taskId}/submit`, {
    deliveryState: "delivered",
    deliveryNote: note,
  });
  return res.data.data;
};

// Still used by the Edits stepper for partial progress tracking (does NOT
// finalize the task — finalizing happens via submitTaskForReview above).
export const updateEditProgress = async (taskId: string, completedCount: number): Promise<RawTask> => {
  const res = await api.put(`/tasks/${taskId}`, { completedCount });
  return res.data.data;
};

export const respondToRejection = async (
  taskId: string,
  changeId: string,
  responseText: string
): Promise<RawTask> => {
  const res = await api.post(`/tasks/${taskId}/respond`, {
    remarks: responseText,
    responses: [{ id: changeId, response: responseText }],
  });
  return res.data.data;
};

export const fetchMyAdditionalWork = async (employeeId: string): Promise<RawAdditionalWork[]> => {
  const res = await api.get(`/additional-work?assignedTo=${employeeId}`);
  return res.data.data;
};

export const createAdditionalWork = async (
  employeeId: string,
  title: string,
  description: string
): Promise<RawAdditionalWork> => {
  const res = await api.post(`/additional-work`, {
    title,
    description,
    date: TODAY,
    assignedTo: employeeId,
    loggedBy: "self",
  });
  return res.data.data;
};

export const updateAdditionalWorkStatus = async (
  id: string,
  status: "pending" | "completed"
): Promise<RawAdditionalWork> => {
  const res = await api.put(`/additional-work/${id}`, { status });
  return res.data.data;
};