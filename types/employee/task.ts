export type TaskStatus = 'pending' | 'in_progress' | 'changes_requested' | 'completed' | 'approved' | 'rejected';

export type DeliveryState = 'not_delivered' | 'delivered';

export interface TaskChangeRequest {
  id: string;
  adminNote: string;
  employeeResponse: string;
  requestedAt: string;
  resolved: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  status: 'pending' | 'completed';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  brandName: string;
  clientName: string;
  status: TaskStatus;
  deliveryState: DeliveryState;
  remarks: string;
  dueDate: string;
  assignedAt: string;
  submittedAt: string | null;
  subtasks: Subtask[];
  // Employee-entered: when they say they actually started working on the task.
  // Filled in by the employee at submit time (not auto-captured).
  // Never overwritten on reject→fix→resubmit cycles — always original start.
  startedAt: string | null;
  // Updated to current ISO timestamp every time employee submits/resubmits.
  // timeTaken = deliveredAt - startedAt (grows across reject cycles naturally).
  deliveredAt: string | null;
  // Set once the employee marks the task completed (their side of the work is done).
  completedAt: string | null;
  // Set separately once the admin/client signs off. Independent of completedAt.
  approvedAt: string | null;
  changeRequests: TaskChangeRequest[];
  // ── NEW: pause/resume timer (same fields as Designer/SMM/Meta/SEO dashboards) ──
  timeSpentMs: number;
  currentSessionStartedAt: string | null;
}

export interface EmployeeTaskStats {
  totalAssigned: number;
  completed: number;
  pending: number;
  changesRequested: number;
  notDelivered: number;
  approved: number;
}

export interface PeriodStats {
  due: number;
  submitted: number;
}

export interface DashboardStats {
  overall: EmployeeTaskStats;
  today: PeriodStats;
  thisWeek: PeriodStats;
  thisMonth: PeriodStats;
}