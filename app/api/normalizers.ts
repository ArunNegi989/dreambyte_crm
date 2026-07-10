import { Task, TaskStatus, DeliveryState, TaskChangeRequest, Subtask } from '../../types/employee/task';

// ── Raw backend task shape ────────────────────────────────────────────────────
export interface BackendTask {
  _id: string;
  title: string;
  description: string;
  assignedTo:
    | { _id: string; name: string; employeeId: string; department: string; role: string }
    | string;
  assignedBy: string;
  brandId: { _id: string; name: string } | string | null;
  frequency: string;
  dueDate: string;
  status: TaskStatus;
  deliveryStatus: 'not_delivered' | 'delivered';
  deliveryNote: string;
  // ── Time tracking fields ───────────────────────────────────────────────
  // startedAt: employee-entered start time, saved once on first submission
  startedAt: string | null;
  // deliveredAt: updated on every submit/resubmit — used for time-taken calc
  deliveredAt: string | null;
  rejectRemark: string;
  changes: {
    _id: string;
    changedBy: string;
    note: string;
    changedAt: string;
    resolved?: boolean;
    employeeResponse?: string;
  }[];
  // ── Subtasks (employee checklist, also visible to admin/SA) ────────────
  subtasks?: {
    _id: string;
    title: string;
    status: 'pending' | 'completed';
    createdAt?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// An entry counts as "authored by the employee" (a log/reply, never replyable
// again) if changedBy is exactly "Employee". Everything else — any admin or
// super_admin name — is a real request the employee can reply to.
function isEmployeeAuthored(changedBy: string): boolean {
  return (changedBy || '').trim().toLowerCase() === 'employee';
}

// ── Normalize backend → frontend ──────────────────────────────────────────────
export function normalizeTask(raw: BackendTask): Task {
  const brandName =
    raw.brandId && typeof raw.brandId === 'object'
      ? raw.brandId.name
      : '';

  const assignedToName =
    raw.assignedTo && typeof raw.assignedTo === 'object'
      ? raw.assignedTo.name
      : '';

  const allChanges = Array.isArray(raw.changes) ? raw.changes : [];

  // Full ordered history. We keep EVERY admin-authored entry (resolved or
  // not) so past rejection cycles are never lost.
  // Employee-authored entries (delivery-log noise) are filtered out —
  // they were never "requests" and were never meant to be replied to.
  const changeRequests: TaskChangeRequest[] = allChanges
    .filter((c) => !isEmployeeAuthored(c.changedBy))
    .map((c) => ({
      id:               c._id,
      adminNote:        c.note || '',
      employeeResponse: c.employeeResponse || '',
      requestedAt:      c.changedAt,
      resolved:         c.resolved ?? false,
    }));

  // ── Subtasks: employee-managed checklist, echoed straight from backend ──
  const subtasks: Subtask[] = Array.isArray(raw.subtasks)
    ? raw.subtasks.map((s) => ({
        id:     s._id,
        title:  s.title,
        status: s.status,
      }))
    : [];

  return {
    id:           raw._id,
    title:        raw.title || '',
    description:  raw.description || '',
    brandName,
    clientName:   assignedToName,
    status:       raw.status,
    deliveryState: raw.deliveryStatus as DeliveryState,
    remarks:      raw.deliveryNote || '',
    dueDate:      raw.dueDate ? raw.dueDate.slice(0, 10) : '',
    assignedAt:   raw.createdAt ? raw.createdAt.slice(0, 10) : '',
    submittedAt:  raw.deliveredAt || null,

    // ── Time tracking ──────────────────────────────────────────────────
    // startedAt: map directly from backend — set once on first submission,
    // never overwritten. Was hardcoded null before, that's why time was missing.
    startedAt:   raw.startedAt || null,
    // deliveredAt: updated on every resubmit — getTimeTaken uses this
    deliveredAt: raw.deliveredAt || null,

    completedAt: null,
    approvedAt:
      raw.status === 'approved'
        ? raw.updatedAt?.slice(0, 10) ?? null
        : null,
    changeRequests,
    subtasks,
  };
}

export function normalizeTasks(raws: BackendTask[]): Task[] {
  return raws.map(normalizeTask);
}