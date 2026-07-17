import { apiFetch } from './apiClient';
import { Task } from '../../types/metadashboard/metaTask';
import { AdditionalTask } from '../../data/metadashboard/dummyData';

export interface MetaStats {
  total: number;
  pending: number;
  approved: number;
  inProgress: number;
  completed: number;
  rejected: number;
  changesRequested: number;
  overdue: number;
  completionRate: number;
  categoryBreakdown: { category: string; count: number }[];
}

// ─── Tasks ─────────────────────────────────────────────────────────────────

export async function fetchMyTasks(employeeId: string): Promise<Task[]> {
  const res = await apiFetch<{ success: boolean; data: Task[] }>(`/meta/tasks?employeeId=${employeeId}`);
  return res.data;
}

export async function fetchDashboardStats(employeeId: string): Promise<MetaStats> {
  const res = await apiFetch<{ success: boolean; data: MetaStats }>(`/meta/dashboard-stats?employeeId=${employeeId}`);
  return res.data;
}

// ── Start / Resume — same generic timer endpoint every other dashboard
// uses. Handles BOTH:
//   • pending -> in_progress (fresh start, backend stamps startedAt +
//     currentSessionStartedAt, clears any stale deliveredAt)
//   • rejected/changes_requested -> status untouched, timer just restarts
//     (used by the "Resume Task" button)
export async function startTask(taskId: string): Promise<Task> {
  const res = await apiFetch<{ success: boolean; data: Task }>(`/tasks/${taskId}/start`, {
    method: 'POST',
    body: {},
  });
  return res.data;
}

// Fresh submission — no open admin notes to reply to yet. Backend stops
// the clock here (folds current session into timeSpentMs).
export async function submitTaskWork(taskId: string, deliveryNote: string): Promise<void> {
  await apiFetch(`/tasks/${taskId}/submit`, {
    method: 'POST',
    body: { deliveryState: 'delivered', deliveryNote },
  });
}

// Reply to every open admin/SA note, then resubmit. Backend stops the
// clock here too (no-op if the task was never resumed).
export async function respondToTaskChanges(
  taskId: string,
  responses: { id: string; response: string }[],
  remarks: string
): Promise<void> {
  await apiFetch(`/tasks/${taskId}/respond`, {
    method: 'POST',
    body: { deliveryState: 'delivered', remarks, responses },
  });
}

// ─── Additional work ─────────────────────────────────────────────────────────

export async function fetchMyAdditionalWork(employeeId: string): Promise<AdditionalTask[]> {
  const res = await apiFetch<{ success: boolean; data: any[] }>(`/additional-work?assignedTo=${employeeId}`);
  return res.data.map((item) => ({
    id: item._id,
    title: item.title,
    category: (item.category || 'other') as AdditionalTask['category'],
    description: item.description,
    date: item.date,
    hoursSpent: item.hoursSpent ?? '',
    outcome: item.outcome || '',
    status: (item.status || 'pending') as AdditionalTask['status'],
  }));
}

export async function createAdditionalWork(
  employeeId: string,
  payload: { title: string; description: string; category: string; date: string; hoursSpent: number | ''; outcome: string }
): Promise<void> {
  await apiFetch('/additional-work', {
    method: 'POST',
    body: {
      assignedTo: employeeId,
      loggedBy: 'self',
      title: payload.title,
      description: payload.description,
      category: payload.category,
      date: payload.date,
      hoursSpent: payload.hoursSpent,
      outcome: payload.outcome,
    },
  });
}

export async function markAdditionalWorkDone(itemId: string): Promise<void> {
  await apiFetch(`/additional-work/${itemId}`, { method: 'PUT', body: { status: 'completed' } });
}