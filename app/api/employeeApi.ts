import { apiFetch } from './apiClient';
import { normalizeTask, normalizeTasks, BackendTask } from './normalizers';
import { Task, DeliveryState, DashboardStats } from '../../types/employee/task';

// ── Stats ─────────────────────────────────────────────────────────────────────
// Route: GET /api/employee/stats
export async function getDashboardStats(): Promise<DashboardStats> {
  const data = await apiFetch<any>('/employee/stats');
  return {
    overall: {
      totalAssigned: data.overall.totalAssigned,
      pending: data.overall.pending,
      // Backend returns key as 'changes_requested', frontend uses 'changesRequested'
      changesRequested: data.overall.changes_requested,
      completed: data.overall.completed,
      approved: data.overall.approved,
      notDelivered: data.overall.notDelivered,
    },
    today: data.today,
    thisWeek: data.thisWeek,
    thisMonth: data.thisMonth,
  };
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

// Route: GET /api/employee/tasks
export async function getMyTasks(params?: {
  status?: string;
  date?: string;
  brand?: string;
}): Promise<Task[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.date) query.set('date', params.date);
  if (params?.brand) query.set('brand', params.brand);

  const qs = query.toString();
  const data = await apiFetch<{ success: boolean; data: BackendTask[] }>(
    `/employee/tasks${qs ? `?${qs}` : ''}`
  );
  return normalizeTasks(data.data);
}

// Route: GET /api/employee/tasks/history
export async function getTaskHistory(params?: {
  status?: string;
  brand?: string;
  delivery?: string;
  dateFrom?: string;
  dateTo?: string;
  hasChanges?: string;
  page?: number;
  limit?: number;
}): Promise<{ tasks: Task[]; total: number; page: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.set(k, String(v));
    });
  }
  const qs = query.toString();
  const data = await apiFetch<{
    success: boolean;
    tasks: BackendTask[];
    total: number;
    page: number;
    totalPages: number;
  }>(`/employee/tasks/history${qs ? `?${qs}` : ''}`);

  return {
    tasks: normalizeTasks(data.tasks),
    total: data.total,
    page: data.page,
    totalPages: data.totalPages,
  };
}

// Route: GET /api/employee/tasks/:id
export async function getTaskById(id: string): Promise<Task> {
  const data = await apiFetch<{ success: boolean; data: BackendTask }>(
    `/employee/tasks/${id}`
  );
  return normalizeTask(data.data);
}

// Route: POST /api/employee/tasks/:id/submit
export async function submitTask(
  taskId: string,
  payload: {
    deliveryState: DeliveryState;
    remarks: string;
    startedAt: string;
  }
): Promise<Task> {
  const data = await apiFetch<{ success: boolean; data: BackendTask }>(
    `/employee/tasks/${taskId}/submit`,
    {
      method: 'POST',
      body: {
        // Map frontend names → backend field names
        deliveryState: payload.deliveryState,
        deliveryNote: payload.remarks,   // backend expects deliveryNote
        startedAt: payload.startedAt,
      },
    }
  );
  return normalizeTask(data.data);
}

// Route: POST /api/employee/tasks/:id/respond
export async function respondToChanges(
  taskId: string,
  payload: {
    deliveryState: DeliveryState;
    remarks: string;
    responses: { id: string; response: string }[];
  }
): Promise<Task> {
  const data = await apiFetch<{ success: boolean; data: BackendTask }>(
    `/employee/tasks/${taskId}/respond`,
    {
      method: 'POST',
      body: {
        deliveryState: payload.deliveryState,
        remarks: payload.remarks,
        responses: payload.responses,
      },
    }
  );
  return normalizeTask(data.data);
}