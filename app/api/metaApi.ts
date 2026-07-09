import { apiFetch } from './apiClient';
import { Task, TaskStatus } from '../../types/metadashboard/metaTask';
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

// Generic status tweak — only used for the harmless "start working" transition
// (pending/approved -> in_progress). Never used for completed/rejected/approved,
// which either have dedicated endpoints or are terminal states set by admins.
export async function setTaskInProgress(taskId: string): Promise<void> {
  await apiFetch(`/tasks/${taskId}`, { method: 'PUT', body: { status: 'in_progress' as TaskStatus } });
}

// Fresh submission — no open admin notes to reply to yet.
export async function submitTaskWork(taskId: string, deliveryNote: string, startedAt?: string): Promise<void> {
  await apiFetch(`/tasks/${taskId}/submit`, {
    method: 'POST',
    body: { deliveryState: 'delivered', deliveryNote, startedAt },
  });
}

// Reply to every open admin/SA note, then resubmit.
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