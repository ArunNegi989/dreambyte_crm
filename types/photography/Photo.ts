// ── Photographer Dashboard: Real Backend-Driven Types ──────────────────────
// This replaces the old static mock-data file. Everything here talks to the
// same /tasks and /additional-work endpoints the rest of the CRM uses —
// Photography tasks are just regular Task documents with `taskType` set to
// "Shoots", "Photo Edit", or "Video Edit" (see data/departmentTasks.ts).

import api from "@/lib/api";

export type WorkStatus = "pending" | "in_progress" | "completed";
export type MediaType = "photo" | "video" | "both";

// ── Raw shape as it comes back from the backend (populated Task document) ──
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

// ── View-shapes the existing board components expect ───────────────────────
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

// ── Deterministic brand color (backend Brand model has no color field) ─────
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

// Backend status can be "pending" | "approved" | "in_progress" | "rejected" |
// "completed" | "changes_requested". Photography's simpler 3-state view
// treats anything not explicitly in_progress/completed as pending.
const toWorkStatus = (status: string): WorkStatus => {
  if (status === "completed") return "completed";
  if (status === "in_progress") return "in_progress";
  return "pending";
};

// ── taskType classifiers (must match data/departmentTasks.ts labels) ───────
export const isShootTask = (t: RawTask) => t.taskType === "Shoots";
export const isEditTask = (t: RawTask) => t.taskType === "Photo Edit" || t.taskType === "Video Edit";

// ── Mappers: RawTask -> view shape ──────────────────────────────────────────
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

// ── API calls ────────────────────────────────────────────────────────────────
export const fetchMyTasks = async (employeeId: string): Promise<RawTask[]> => {
  const res = await api.get(`/tasks?assignedTo=${employeeId}`);
  return res.data.data;
};

export const updateTaskStatus = async (taskId: string, status: WorkStatus): Promise<RawTask> => {
  const res = await api.put(`/tasks/${taskId}`, { status });
  return res.data.data;
};

export const updateEditProgress = async (taskId: string, completedCount: number): Promise<RawTask> => {
  const res = await api.put(`/tasks/${taskId}`, { completedCount });
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