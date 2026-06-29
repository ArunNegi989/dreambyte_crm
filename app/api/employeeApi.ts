import { apiFetch } from './apiClient';
import { Task, DeliveryState, DashboardStats } from '../../types/employee/task';

// ── Normalizer ────────────────────────────────────────────────────────────────
export function normalizeTask(raw: any): Task {
  const brandName = raw.brandId && typeof raw.brandId === 'object' ? raw.brandId.name : (raw.brandId || '');
  const assignedName = raw.assignedTo && typeof raw.assignedTo === 'object' ? raw.assignedTo.name : '';

  const changeRequests = (raw.changes || []).map((c: any) => ({
    id: c._id,
    adminNote: c.note,
    employeeResponse: c.employeeResponse || '',
    requestedAt: c.changedAt,
    resolved: c.resolved ?? false,
  }));

  return {
    id: raw._id,
    title: raw.title || '',
    description: raw.description || '',
    brandName,
    clientName: assignedName,
    status: raw.status,
    deliveryState: raw.deliveryStatus as any,
    remarks: raw.deliveryNote || '',
    dueDate: raw.dueDate ? raw.dueDate.slice(0, 10) : '',
    assignedAt: raw.createdAt ? raw.createdAt.slice(0, 10) : '',
    submittedAt: raw.deliveredAt || null,
    startedAt: raw.startedAt || null,
    completedAt: raw.deliveredAt || null,
    approvedAt: raw.status === 'approved' ? (raw.updatedAt?.slice(0, 10) ?? null) : null,
    changeRequests,
  };
}

function normalizeTasks(raws: any[]): Task[] {
  return raws.map(normalizeTask);
}

// ── Stats ─────────────────────────────────────────────────────────────────────
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const data = await apiFetch<any>('/employee/stats');
    return {
      overall: {
        totalAssigned: data.overall.totalAssigned,
        pending: data.overall.pending,
        changesRequested: data.overall.changes_requested,
        completed: data.overall.completed,
        approved: data.overall.approved,
        notDelivered: data.overall.notDelivered,
      },
      today: data.today,
      thisWeek: data.thisWeek,
      thisMonth: data.thisMonth,
    };
  } catch (error) {
    throw new Error(`Failed to fetch dashboard stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export async function getMyTasks(params?: { status?: string; date?: string }): Promise<Task[]> {
  try {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.date) query.set('date', params.date);
    const qs = query.toString();
    const data = await apiFetch<any>(`/employee/tasks${qs ? `?${qs}` : ''}`);
    return normalizeTasks(data.data);
  } catch (error) {
    throw new Error(`Failed to fetch tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function submitTask(taskId: string, payload: { deliveryState: DeliveryState; remarks: string; startedAt: string }): Promise<Task> {
  if (!taskId) {
    throw new Error('Task ID is required');
  }

  try {
    const data = await apiFetch<any>(`/employee/tasks/${taskId}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        deliveryState: payload.deliveryState,
        deliveryNote: payload.remarks,
        startedAt: payload.startedAt,
      }),
    });
    return normalizeTask(data.data);
  } catch (error) {
    throw new Error(`Failed to submit task: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function respondToChanges(taskId: string, payload: { deliveryState: DeliveryState; remarks: string; responses: { id: string; response: string }[] }): Promise<Task> {
  if (!taskId) {
    throw new Error('Task ID is required');
  }

  try {
    const data = await apiFetch<any>(`/employee/tasks/${taskId}/respond`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeTask(data.data);
  } catch (error) {
    throw new Error(`Failed to respond to changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getTaskHistory(params?: { status?: string; brand?: string; delivery?: string; dateFrom?: string; dateTo?: string; hasChanges?: string; page?: number; limit?: number }): Promise<{ tasks: Task[]; total: number; page: number; totalPages: number }> {
  try {
    const query = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') query.set(k, String(v)); });
    const qs = query.toString();
    const data = await apiFetch<any>(`/employee/tasks/history${qs ? `?${qs}` : ''}`);
    return { tasks: normalizeTasks(data.tasks), total: data.total, page: data.page, totalPages: data.totalPages };
  } catch (error) {
    throw new Error(`Failed to fetch task history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}