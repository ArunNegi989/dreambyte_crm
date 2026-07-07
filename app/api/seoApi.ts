import { Task, AdditionalTask, TaskStatus, TaskDetails } from '../../types/seodashboard/task';
import { computeDashboardStats } from '../../data/seodashboard/taskStats';
import { buildDummyTasks, buildDummyAdditionalTasks } from '../../data/seodashboard/dummyTasks';

// This module stands in for a real backend. Every function returns a Promise
// with a small artificial delay so the pages behave exactly like they would
// against a real API (loading states, async updates, etc). Swap the bodies
// below for real `fetch` calls whenever the SEO endpoints exist — the
// function signatures are designed to stay the same.

const TASKS_KEY = 'seo_dashboard_tasks_v1';
const ADDITIONAL_KEY = 'seo_dashboard_additional_tasks_v1';
const LATENCY_MS = 250;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
}

function readTasks(): Task[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(TASKS_KEY);
  if (!raw) {
    const seeded = buildDummyTasks();
    window.localStorage.setItem(TASKS_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as Task[];
  } catch {
    return [];
  }
}

function writeTasks(tasks: Task[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function readAdditionalTasks(): AdditionalTask[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(ADDITIONAL_KEY);
  if (!raw) {
    const seeded = buildDummyAdditionalTasks();
    window.localStorage.setItem(ADDITIONAL_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as AdditionalTask[];
  } catch {
    return [];
  }
}

function writeAdditionalTasks(items: AdditionalTask[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ADDITIONAL_KEY, JSON.stringify(items));
}

export interface TaskFilters {
  status?: TaskStatus | 'all';
  category?: string;
}

export async function getMyTasks(filters: TaskFilters = {}): Promise<Task[]> {
  let tasks = readTasks();
  if (filters.status && filters.status !== 'all') {
    tasks = tasks.filter((t) => t.status === filters.status);
  }
  if (filters.category && filters.category !== 'all') {
    tasks = tasks.filter((t) => t.category === filters.category);
  }
  return delay(tasks);
}

export async function getDashboardStats() {
  const tasks = readTasks();
  const additional = readAdditionalTasks();
  return delay(computeDashboardStats(tasks, additional.length));
}

export interface UpdateTaskPayload {
  status: TaskStatus;
  remarks?: string;
  details?: TaskDetails;
}

export async function updateTaskWork(taskId: string, payload: UpdateTaskPayload): Promise<Task> {
  const tasks = readTasks();
  const idx = tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) throw new Error('Task not found');

  const now = new Date().toISOString();
  const updated: Task = {
    ...tasks[idx],
    status: payload.status,
    remarks: payload.remarks,
    details: { ...tasks[idx].details, ...payload.details },
    submittedAt: tasks[idx].submittedAt || now,
    completedAt: payload.status === 'completed' ? now : tasks[idx].completedAt,
  };
  tasks[idx] = updated;
  writeTasks(tasks);
  return delay(updated);
}

export async function getAdditionalTasks(): Promise<AdditionalTask[]> {
  return delay(readAdditionalTasks().slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export async function addAdditionalTask(payload: Omit<AdditionalTask, 'id' | 'createdAt'>): Promise<AdditionalTask> {
  const items = readAdditionalTasks();
  const created: AdditionalTask = {
    ...payload,
    id: `add_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  items.unshift(created);
  writeAdditionalTasks(items);
  return delay(created);
}

export async function updateAdditionalTask(id: string, payload: Partial<AdditionalTask>): Promise<AdditionalTask> {
  const items = readAdditionalTasks();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error('Additional task not found');
  items[idx] = { ...items[idx], ...payload };
  writeAdditionalTasks(items);
  return delay(items[idx]);
}

export async function deleteAdditionalTask(id: string): Promise<void> {
  const items = readAdditionalTasks().filter((i) => i.id !== id);
  writeAdditionalTasks(items);
  return delay(undefined);
}
