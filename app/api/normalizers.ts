import { Task, TaskStatus, DeliveryState, TaskChangeRequest } from '../../types/employee/task';

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
  // not) so past rejection cycles are never lost — this is the core fix.
  // Employee-authored entries (delivery-log noise from deliverTask) are
  // filtered out entirely; they were never "requests" and were never
  // meant to be replied to.
  const changeRequests: TaskChangeRequest[] = allChanges
    .filter((c) => !isEmployeeAuthored(c.changedBy))
    .map((c) => ({
      id: c._id,
      adminNote: c.note || '',
      employeeResponse: c.employeeResponse || '',
      requestedAt: c.changedAt,
      resolved: c.resolved ?? false,
    }));

  return {
    id: raw._id,
    title: raw.title || '',
    description: raw.description || '',
    brandName,
    clientName: assignedToName,
    status: raw.status,
    deliveryState: raw.deliveryStatus as DeliveryState,
    remarks: raw.deliveryNote || '',
    dueDate: raw.dueDate ? raw.dueDate.slice(0, 10) : '',
    assignedAt: raw.createdAt ? raw.createdAt.slice(0, 10) : '',
    submittedAt: raw.deliveredAt || null,
    startedAt: null,
    completedAt: raw.deliveredAt || null,
    approvedAt:
      raw.status === 'approved'
        ? raw.updatedAt?.slice(0, 10) ?? null
        : null,
    changeRequests,
  };
}

export function normalizeTasks(raws: BackendTask[]): Task[] {
  return raws.map(normalizeTask);
}