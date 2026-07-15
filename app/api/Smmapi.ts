import api from "@/lib/api";
import { RawTask, AdditionalWork } from "@/types/smm/SMM";

export interface BrandOption {
  _id: string;
  name: string;
}

// ── Tasks (covers both general tasks AND posting entries — the dashboard
// splits them client-side via isPostingEntry()) ─────────────────────────
// GET /tasks — backend auto-filters to `assignedTo: req.user.id` whenever
// the logged-in user's role is "employee", so an SMM only ever gets back
// tasks the Super Admin / Admin actually assigned to them.
export const fetchMyTasks = async (): Promise<RawTask[]> => {
  const res = await api.get("/tasks");
  return res.data.data as RawTask[];
};

// Used by the Posting Tracker to show every brand's coverage grid, even
// brands with nothing scheduled today.
export const fetchBrands = async (): Promise<BrandOption[]> => {
  const res = await api.get("/brands");
  return res.data.data as BrandOption[];
};

// ── UPDATED: Start / Resume — same generic endpoint the Designer/Employee
// dashboards use. Handles BOTH:
//   • pending -> in_progress (fresh start, backend stamps startedAt)
//   • rejected/changes_requested -> status untouched, just restarts the
//     timer session (resume) — used by the new "Resume Task" button.
// Idempotent: calling it again while already running is a no-op.
export const startTask = async (taskId: string): Promise<RawTask> => {
  const res = await api.post(`/tasks/${taskId}/start`, {});
  return res.data.data as RawTask;
};

// in_progress -> completed ("completed" = submitted, awaiting Super Admin review)
export const submitTaskForReview = async (
  taskId: string,
  deliveryNote: string
): Promise<RawTask> => {
  const res = await api.post(`/tasks/${taskId}/submit`, {
    deliveryState: "delivered",
    deliveryNote,
  });
  return res.data.data as RawTask;
};

// rejected | changes_requested -> completed, after replying to every open note
export const respondToTaskChanges = async (
  taskId: string,
  responses: { id: string; response: string }[],
  remarks?: string
): Promise<RawTask> => {
  const res = await api.post(`/tasks/${taskId}/respond`, {
    deliveryState: "delivered",
    remarks: remarks ?? "",
    responses,
  });
  return res.data.data as RawTask;
};

// ── Additional work ─────────────────────────────────────────────────────
// GET /additional-work — same role-based filter as /tasks, so this only
// ever returns the logged-in SMM's own entries, never every employee's.
export const fetchMyAdditionalWork = async (): Promise<AdditionalWork[]> => {
  const res = await api.get("/additional-work");
  return res.data.data as AdditionalWork[];
};

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