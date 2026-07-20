import { apiFetch } from './apiClient';
import { Task, AdditionalTask, TaskStatus, TaskDetails } from '../../types/seodashboard/task';

function getEmployeeId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.id || '';
  } catch {
    return '';
  }
}

export interface TaskFilters {
  status?: TaskStatus | 'all';
  category?: string;
}

export async function getMyTasks(filters: TaskFilters = {}): Promise<Task[]> {
  const params = new URLSearchParams({ employeeId: getEmployeeId() });
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.category && filters.category !== 'all') params.set('category', filters.category);

  const res = await apiFetch<{ success: boolean; data: Task[] }>(`/seo/tasks?${params.toString()}`);
  return res.data;
}

export async function getDashboardStats() {
  const res = await apiFetch<{ success: boolean; data: any }>(`/seo/dashboard-stats?employeeId=${getEmployeeId()}`);
  return res.data;
}

export interface UpdateTaskPayload {
  status: TaskStatus;
  remarks?: string;
  details?: TaskDetails;
}

// Generic status/details PUT. Still used for anything that ISN'T a
// start/submit action (e.g. admin editing a task's category fields
// directly). Do NOT use this to move a task into "in_progress" or
// "completed" — those need startTask()/submitTask() below so the backend
// actually stamps currentSessionStartedAt / stops the timer correctly.
// A plain status PUT here only flips the status field; it does not touch
// the pause-aware timer fields, so "time taken" would silently stop
// accumulating for a task started this way.
export async function updateTaskWork(taskId: string, payload: UpdateTaskPayload): Promise<Task> {
  const res = await apiFetch<{ success: boolean; data: Task }>(`/seo/tasks/${taskId}`, {
    method: 'PUT',
    body: payload,
  });
  return res.data;
}

// ── Start / Resume Task ─────────────────────────────────────────────────
// ASSUMPTION: mirrors the dedicated POST /tasks/:id/start endpoint used by
// every other dashboard (Designer, SMM, Employee) and the /seo/tasks/:id
// /respond endpoint already proven to exist for this module. This is what
// actually stamps currentSessionStartedAt server-side (and clears a stale
// deliveredAt on resume) — a generic status PUT does NOT do this, which is
// why "time taken" was inconsistent here. If your backend's seoTaskRoutes
// doesn't expose this path yet, this call will 404 — let me know and I'll
// either point it at the right route or add the missing backend handler.
export async function startTask(taskId: string): Promise<Task> {
  const res = await apiFetch<{ success: boolean; data: Task }>(`/seo/tasks/${taskId}/start`, {
    method: 'POST',
    body: {},
  });
  return res.data;
}

export interface SubmitTaskPayload {
  remarks?: string;
  details?: TaskDetails;
}

// ── Submit for Review ───────────────────────────────────────────────────
// ASSUMPTION: same caveat as startTask() above — expected to stop the
// running timer (fold the session into timeSpentMs), stamp deliveredAt,
// and set status to "completed" server-side, mirroring every other
// dashboard's submit flow. Category detail fields are sent along so the
// employee's filled-in data (backlinks/keywords/etc.) is saved in the same
// call as the submit.
export async function submitTask(taskId: string, payload: SubmitTaskPayload): Promise<Task> {
  const res = await apiFetch<{ success: boolean; data: Task }>(`/seo/tasks/${taskId}/submit`, {
    method: 'POST',
    body: payload,
  });
  return res.data;
}

// ── Additional tasks — reuses the same /additional-work backend as Meta ────

function mapAdditionalTask(item: any): AdditionalTask {
  return {
    id: item._id ?? item.id,
    title: item.title,
    category: (item.category || 'other') as AdditionalTask['category'],
    description: item.description,
    date: item.date,
    hoursSpent: item.hoursSpent ?? '',
    outcome: item.outcome || '',
    createdAt: item.createdAt,
    status: (item.status || 'pending') as AdditionalTask['status'],
  };
}

export async function getAdditionalTasks(): Promise<AdditionalTask[]> {
  const res = await apiFetch<{ success: boolean; data: any[] }>(`/additional-work?assignedTo=${getEmployeeId()}`);
  return res.data.map(mapAdditionalTask).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addAdditionalTask(payload: Omit<AdditionalTask, 'id' | 'createdAt' | 'status'>): Promise<AdditionalTask> {
  const res = await apiFetch<{ success: boolean; data: any }>(`/additional-work`, {
    method: 'POST',
    body: {
      assignedTo: getEmployeeId(),
      loggedBy: 'self',
      title: payload.title,
      description: payload.description,
      category: payload.category,
      date: payload.date,
      hoursSpent: payload.hoursSpent,
      outcome: payload.outcome,
    },
  });
  return mapAdditionalTask(res.data);
}

export async function updateAdditionalTask(id: string, payload: Partial<AdditionalTask>): Promise<AdditionalTask> {
  const res = await apiFetch<{ success: boolean; data: any }>(`/additional-work/${id}`, {
    method: 'PUT',
    body: payload,
  });
  return mapAdditionalTask(res.data);
}

export async function deleteAdditionalTask(id: string): Promise<void> {
  await apiFetch(`/additional-work/${id}`, { method: 'DELETE' });
}

// Marks a logged additional-work entry as done.
// ⚠️ Same open question as the Meta dashboard: confirm /additional-work/:id
// PUT actually persists a `status` field on the backend.
export async function markAdditionalWorkDone(id: string): Promise<AdditionalTask> {
  const res = await apiFetch<{ success: boolean; data: any }>(`/additional-work/${id}`, {
    method: 'PUT',
    body: { status: 'completed' },
  });
  return mapAdditionalTask(res.data);
}

export async function respondToTaskChange(taskId: string, changeId: string, response: string): Promise<Task> {
  const res = await apiFetch<{ success: boolean; data: Task }>(`/seo/tasks/${taskId}/respond`, {
    method: 'POST',
    body: { changeId, response },
  });
  return res.data;
}