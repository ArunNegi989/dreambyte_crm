import api from "@/lib/api";
import { DesignTask, AdditionalWork } from "@/types/designer/Designer";

// ── Tasks ────────────────────────────────────────────────────────────────
// GET /tasks — backend auto-filters to `assignedTo: req.user.id` whenever
// the logged-in user's role is "employee", so a designer only ever gets
// back tasks the Super Admin / Admin actually assigned to them.
export const fetchMyTasks = async (): Promise<DesignTask[]> => {
  const res = await api.get("/tasks");
  return res.data.data as DesignTask[];
};

// Employee starts a task: pending -> in_progress
// (backend stamps `startedAt` automatically the first time this happens —
// that's what powers the "time taken" calculation later.)
export const startTask = async (taskId: string): Promise<DesignTask> => {
  const res = await api.put(`/tasks/${taskId}`, { status: "in_progress" });
  return res.data.data as DesignTask;
};

// Employee submits a task for review (in_progress -> completed).
// "completed" here means "submitted, waiting on Super Admin" — the Super
// Admin still has to move it to "approved" (or send it back rejected).
export const submitTaskForReview = async (
  taskId: string,
  deliveryNote: string,
  startedAt?: string | null
): Promise<DesignTask> => {
  const res = await api.post(`/tasks/${taskId}/submit`, {
    deliveryState: "delivered",
    deliveryNote,
    startedAt: startedAt ?? undefined,
  });
  return res.data.data as DesignTask;
};

// Employee replies to every open change-log note (from a rejection / change
// request) in one shot, then resubmits (rejected|changes_requested -> completed).
export const respondToTaskChanges = async (
  taskId: string,
  responses: { id: string; response: string }[],
  remarks?: string
): Promise<DesignTask> => {
  const res = await api.post(`/tasks/${taskId}/respond`, {
    deliveryState: "delivered",
    remarks: remarks ?? "",
    responses,
  });
  return res.data.data as DesignTask;
};

// ── Additional work ─────────────────────────────────────────────────────
export const fetchMyAdditionalWork = async (): Promise<AdditionalWork[]> => {
  const res = await api.get("/additional-work");
  return res.data.data as AdditionalWork[];
};

// loggedBy "self" — backend defaults assignedTo to the logged-in employee,
// so we don't need to know our own Mongo _id on the frontend.
export const addAdditionalWork = async (
  title: string,
  description: string
): Promise<AdditionalWork> => {
  const res = await api.post("/additional-work", {
    title,
    description,
    date: new Date().toISOString().split("T")[0],
    loggedBy: "self",
  });
  return res.data.data as AdditionalWork;
};

export const markAdditionalWorkDone = async (id: string): Promise<AdditionalWork> => {
  const res = await api.put(`/additional-work/${id}`, { status: "completed" });
  return res.data.data as AdditionalWork;
};