export type TaskStatus =
  | 'pending'
  | 'approved'
  | 'in_progress'
  | 'rejected'
  | 'completed'
  | 'changes_requested';

export interface TaskChange {
  _id: string;
  changedBy: string;
  note: string;
  changedAt: string;
  resolved: boolean;
  employeeResponse?: string;
}

export interface Task {
  id: string;
  title: string;
  category: string; // taskType — e.g. "metaAds", or whatever the admin typed
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: TaskStatus;
  assignedTo: string;
  dueDate: string;
  description: string;
  details: Record<string, string>;
  deliveryStatus: 'delivered' | 'not_delivered';
  rejectRemark: string;
  startedAt?: string;
  deliveredAt?: string;
  // ── Pause/resume timer — drives the Resume Task button + session-based
  // "time taken" calc (freezes on submit, excludes reject-wait gap, resumes
  // fresh when Resume is clicked) ─────────────────────────────────────────
  timeSpentMs?: number;
  currentSessionStartedAt?: string | null;
  changes: TaskChange[];
}