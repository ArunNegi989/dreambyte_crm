import { Task, EmployeeTaskStats, PeriodStats, DashboardStats, TaskStatus } from '../../types/employee/task';

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  changes_requested: 'Changes requested',
  completed: 'Completed',
  approved: 'Approved',
};

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfWeek(d: Date): Date {
  // Week starts Monday
  const copy = startOfDay(d);
  const day = copy.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function isWithin(dateStr: string, from: Date, referenceNow: Date): boolean {
  const date = startOfDay(new Date(dateStr));
  return date >= from && date <= startOfDay(referenceNow);
}

function isSameDay(dateStr: string, reference: Date): boolean {
  const date = startOfDay(new Date(dateStr));
  return date.getTime() === startOfDay(reference).getTime();
}

export function computeEmployeeStats(tasks: Task[]): EmployeeTaskStats {
  return {
    totalAssigned: tasks.length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    changesRequested: tasks.filter((t) => t.status === 'changes_requested').length,
    notDelivered: tasks.filter((t) => t.deliveryState === 'not_delivered' && t.status !== 'completed' && t.status !== 'approved').length,
    approved: tasks.filter((t) => t.status === 'approved').length,
  };
}

function periodStatsForDue(tasks: Task[], from: Date, now: Date): PeriodStats['due'] {
  return tasks.filter((t) => isWithin(t.dueDate, from, now) || isSameDay(t.dueDate, now)).length;
}

function periodStatsForSubmitted(tasks: Task[], from: Date, now: Date): PeriodStats['submitted'] {
  return tasks.filter((t) => t.submittedAt && (isWithin(t.submittedAt, from, now) || isSameDay(t.submittedAt, now))).length;
}

export function computeDashboardStats(tasks: Task[], now: Date = new Date()): DashboardStats {
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  return {
    overall: computeEmployeeStats(tasks),
    today: {
      due: tasks.filter((t) => isSameDay(t.dueDate, now)).length,
      submitted: tasks.filter((t) => t.submittedAt && isSameDay(t.submittedAt, now)).length,
    },
    thisWeek: {
      due: periodStatsForDue(tasks, weekStart, now),
      submitted: periodStatsForSubmitted(tasks, weekStart, now),
    },
    thisMonth: {
      due: periodStatsForDue(tasks, monthStart, now),
      submitted: periodStatsForSubmitted(tasks, monthStart, now),
    },
  };
}

export interface TaskDateGroup {
  label: string;
  dateKey: string;
  tasks: Task[];
}

export function groupTasksByDueDate(tasks: Task[], now: Date = new Date()): TaskDateGroup[] {
  const todayKey = startOfDay(now).toISOString().slice(0, 10);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = startOfDay(yesterday).toISOString().slice(0, 10);

  const groups = new Map<string, Task[]>();
  for (const task of tasks) {
    const key = task.dueDate;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(task);
  }

  const sortedKeys = Array.from(groups.keys()).sort((a, b) => (a < b ? 1 : -1));

  return sortedKeys.map((key) => {
    let label: string;
    if (key === todayKey) {
      label = 'Today';
    } else if (key === yesterdayKey) {
      label = 'Yesterday';
    } else {
      label = new Date(key).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    }
    return { label, dateKey: key, tasks: groups.get(key)! };
  });
}