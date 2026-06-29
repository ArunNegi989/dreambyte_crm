import { apiFetch } from './apiClient';
import { normalizeTask, normalizeTasks, BackendTask } from './normalizers';
import { Task } from '../../types/employee/task';

// ── Auth ─────────────────────────────────────────────────────────────────────

// Route: POST /api/superadmin/auth/login
export async function superAdminLogin(payload: {
  employeeId: string;
  password: string;
}) {
  return apiFetch<{
    success: boolean;
    token: string;
    redirectTo: string;
    user: any;
  }>('/superadmin/auth/login', { method: 'POST', body: payload });
}

// Route: POST /api/superadmin/auth/register
export async function superAdminRegister(payload: {
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  dob: string;
  department: string;
  password: string;
  joinDate: string;
}) {
  return apiFetch<{ success: boolean; message: string; user: any }>(
    '/superadmin/auth/register',
    { method: 'POST', body: payload }
  );
}

// Route: POST /api/superadmin/auth/logout
export async function superAdminLogout() {
  return apiFetch('/superadmin/auth/logout', { method: 'POST' });
}

// ── Employees ─────────────────────────────────────────────────────────────────

export interface EmployeeData {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  department: string;
  role: string;
  joinDate: string;
  isActive: boolean;
}

// Route: GET /api/superadmin/employees
export async function getEmployees(): Promise<EmployeeData[]> {
  const data = await apiFetch<{ success: boolean; count: number; data: EmployeeData[] }>(
    '/superadmin/employees'
  );
  return data.data;
}

// Route: GET /api/superadmin/employees/:id
export async function getEmployee(id: string): Promise<EmployeeData> {
  const data = await apiFetch<{ success: boolean; data: EmployeeData }>(
    `/superadmin/employees/${id}`
  );
  return data.data;
}

// Route: POST /api/superadmin/employees
export async function createEmployee(payload: {
  name: string;
  email: string;
  phone?: string;
  dob: string;
  department: string;
  role?: string;
  password: string;
}): Promise<{ employee: EmployeeData; plainPassword: string }> {
  const data = await apiFetch<{
    success: boolean;
    data: EmployeeData;
    plainPassword: string;
  }>('/superadmin/employees', { method: 'POST', body: payload });
  return { employee: data.data, plainPassword: data.plainPassword };
}

// Route: PUT /api/superadmin/employees/:id
export async function updateEmployee(
  id: string,
  payload: Partial<{
    name: string;
    email: string;
    phone: string;
    department: string;
    role: string;
    isActive: boolean;
  }>
): Promise<EmployeeData> {
  const data = await apiFetch<{ success: boolean; data: EmployeeData }>(
    `/superadmin/employees/${id}`,
    { method: 'PUT', body: payload }
  );
  return data.data;
}

// Route: DELETE /api/superadmin/employees/:id
export async function deleteEmployee(id: string): Promise<void> {
  await apiFetch(`/superadmin/employees/${id}`, { method: 'DELETE' });
}

// ── Brands ────────────────────────────────────────────────────────────────────

export interface BrandData {
  _id: string;
  name: string;
  industry: string;
  status: string;
}

// Route: GET /api/superadmin/brands
export async function getBrands(): Promise<BrandData[]> {
  const data = await apiFetch<{ success: boolean; count: number; data: BrandData[] }>(
    '/superadmin/brands'
  );
  return data.data;
}

// Route: GET /api/superadmin/brands/:id
export async function getBrand(id: string): Promise<BrandData> {
  const data = await apiFetch<{ success: boolean; data: BrandData }>(
    `/superadmin/brands/${id}`
  );
  return data.data;
}

// Route: POST /api/superadmin/brands
export async function createBrand(payload: {
  name: string;
  industry: string;
  status?: string;
}): Promise<BrandData> {
  const data = await apiFetch<{ success: boolean; data: BrandData }>(
    '/superadmin/brands',
    { method: 'POST', body: payload }
  );
  return data.data;
}

// Route: PUT /api/superadmin/brands/:id
export async function updateBrand(
  id: string,
  payload: Partial<{ name: string; industry: string; status: string }>
): Promise<BrandData> {
  const data = await apiFetch<{ success: boolean; data: BrandData }>(
    `/superadmin/brands/${id}`,
    { method: 'PUT', body: payload }
  );
  return data.data;
}

// Route: DELETE /api/superadmin/brands/:id
export async function deleteBrand(id: string): Promise<void> {
  await apiFetch(`/superadmin/brands/${id}`, { method: 'DELETE' });
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

// Route: GET /api/superadmin/tasks
export async function getAllTasks(params?: { assignedTo?: string }): Promise<Task[]> {
  const qs = params?.assignedTo ? `?assignedTo=${params.assignedTo}` : '';
  const data = await apiFetch<{ success: boolean; count: number; data: BackendTask[] }>(
    `/superadmin/tasks${qs}`
  );
  return normalizeTasks(data.data);
}

// Route: GET /api/superadmin/tasks/:id
export async function getTaskById(id: string): Promise<Task> {
  const data = await apiFetch<{ success: boolean; data: BackendTask }>(
    `/superadmin/tasks/${id}`
  );
  return normalizeTask(data.data);
}

// Route: POST /api/superadmin/tasks
export async function createTask(payload: {
  title: string;
  description?: string;
  assignedTo: string;
  assignedBy: string;
  brandId?: string;
  frequency?: string;
  dueDate?: string;
}): Promise<Task> {
  const data = await apiFetch<{ success: boolean; data: BackendTask }>(
    '/superadmin/tasks',
    { method: 'POST', body: payload }
  );
  return normalizeTask(data.data);
}

// Route: PUT /api/superadmin/tasks/:id
export async function updateTask(
  id: string,
  payload: {
    title?: string;
    description?: string;
    assignedTo?: string;
    brandId?: string;
    frequency?: string;
    dueDate?: string;
    status?: string;
    rejectRemark?: string;
  }
): Promise<Task> {
  const data = await apiFetch<{ success: boolean; data: BackendTask }>(
    `/superadmin/tasks/${id}`,
    { method: 'PUT', body: payload }
  );
  return normalizeTask(data.data);
}

// Route: POST /api/superadmin/tasks/:id/changes
export async function addChangeToTask(
  id: string,
  payload: { note: string; changedBy?: string }
): Promise<Task> {
  const data = await apiFetch<{ success: boolean; data: BackendTask }>(
    `/superadmin/tasks/${id}/changes`,
    { method: 'POST', body: payload }
  );
  return normalizeTask(data.data);
}

// Route: DELETE /api/superadmin/tasks/:id
export async function deleteTask(id: string): Promise<void> {
  await apiFetch(`/superadmin/tasks/${id}`, { method: 'DELETE' });
}