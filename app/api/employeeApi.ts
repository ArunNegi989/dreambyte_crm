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
      // Backend returns key as 'changes_requested', frontend uses 'changesRequested'
      changesRequested: data.overall.changes_requested,
      completed: data.overall.completed,
      approved: data.overall.approved,
      notDelivered: data.overall.notDelivered,
      pending: data.overall.pending,
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

// ── Start / Resume ─────────────────────────────────────────────────────────
// Route: POST /api/employee/tasks/:id/start
// pending -> in_progress (fresh start, clicked from "Start Task" button) OR
// rejected/changes_requested -> status untouched, timer restarts ("Resume
// Task" button). Same generic /start endpoint every other dashboard uses.
export async function startTask(taskId: string): Promise<Task> {
  const data = await apiFetch<{ success: boolean; data: BackendTask }>(
    `/employee/tasks/${taskId}/start`,
    { method: 'POST', body: {} }
  );
  return normalizeTask(data.data);
}

// Route: POST /api/employee/tasks/:id/submit
// ── UPDATED: startedAt no longer sent — the employee never types a start
// date/time manually anymore. Backend already stamped startedAt on the
// task the moment "Start Task" was clicked (via startTask() above), so
// there's nothing left for the frontend to pass here except the delivery
// state and remarks.
export async function submitTask(
  taskId: string,
  payload: {
    deliveryState: DeliveryState;
    remarks: string;
  }
): Promise<Task> {
  const data = await apiFetch<{ success: boolean; data: BackendTask }>(
    `/employee/tasks/${taskId}/submit`,
    {
      method: 'POST',
      body: {
        deliveryState: payload.deliveryState,
        deliveryNote: payload.remarks,
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

// ── Subtasks ──────────────────────────────────────────────────────────────────

// Route: POST /api/employee/tasks/:id/subtasks
export async function addSubtask(taskId: string, title: string): Promise<Task> {
  const data = await apiFetch<{ success: boolean; data: BackendTask }>(
    `/employee/tasks/${taskId}/subtasks`,
    { method: 'POST', body: { title } }
  );
  return normalizeTask(data.data);
}

// Route: PATCH /api/employee/tasks/:id/subtasks/:subtaskId
export async function toggleSubtask(taskId: string, subtaskId: string): Promise<Task> {
  const data = await apiFetch<{ success: boolean; data: BackendTask }>(
    `/employee/tasks/${taskId}/subtasks/${subtaskId}`,
    { method: 'PATCH' }
  );
  return normalizeTask(data.data);
}

// Route: DELETE /api/employee/tasks/:id/subtasks/:subtaskId
export async function removeSubtask(taskId: string, subtaskId: string): Promise<Task> {
  const data = await apiFetch<{ success: boolean; data: BackendTask }>(
    `/employee/tasks/${taskId}/subtasks/${subtaskId}`,
    { method: 'DELETE' }
  );
  return normalizeTask(data.data);
}