import { Task } from "@/types/admin/Crm";

// ── Additional Work (matches AdditionalWork model / additionalWorkController) ─
export interface AdditionalWorkEntry {
  _id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  status: "pending" | "completed";
  loggedBy: "self" | "admin";
  assignedTo: string | { _id: string; name: string };
  category?: string;
  hoursSpent?: number | null;
  outcome?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeekBucket {
  label: string;
  rangeStart: Date;
  rangeEnd: Date;
  assigned: number;
  completed: number;
  rejected: number;
}

export interface MonthBucket {
  label: string;
  assigned: number;
  completed: number;
  rejected: number;
}

export interface ProgressScoreResult {
  score: number;
  completionRate: number;
  rejectionPenalty: number;
  totalRejections: number;
}

export interface EmployeeProgressStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  approvedTasks: number;
  rejectedTasks: number;
  inProgressTasks: number;
  deliveredCount: number;
  notDeliveredCount: number;
  totalRejectionCycles: number;
  avgTimeTakenMinutes: number | null;
  avgTimeTakenLabel: string;
  fastestTaskLabel: string;
  slowestTaskLabel: string;
  progress: ProgressScoreResult;
  weekly: WeekBucket[];
  monthly: MonthBucket[];
  statusBreakdown: { label: string; value: number; color: string }[];
}

export const getAssigneeId = (
  assignedTo: string | { _id: string; name: string } | null | undefined
): string | null => {
  if (!assignedTo) return null;
  return typeof assignedTo === "object" ? assignedTo._id : assignedTo;
};

export const getTasksForEmployee = (tasks: Task[], employeeId: string): Task[] =>
  tasks.filter((t) => getAssigneeId(t.assignedTo) === employeeId);

// Every time an admin/SA rejects a task, taskController pushes a change log
// entry whose note starts with "Rejected by ...". Counting those gives the
// true number of reject → redo cycles a task went through.
export const countRejectionCycles = (task: Task): number =>
  task.changes.filter((c) => c.note?.startsWith("Rejected by")).length;

// "completed" gets set automatically the moment an employee submits/
// delivers their own task (see submitTask / deliverTask in the backend) —
// it is NOT an admin decision, just the employee's own submission.
// "approved" is the only status an admin explicitly sets after reviewing
// the work, so it's the only one that should count as genuinely finished
// for progress-tracking purposes. Until an admin approves it, the task
// should NOT count toward "Completed" here, even if its raw status says
// "completed".
const DONE_STATUSES = new Set(["approved"]);
export const isDoneStatus = (status: string): boolean => DONE_STATUSES.has(status);

// From the admin's point of view, a task stays "Pending" the whole time
// it's waiting on their decision — that includes the raw "pending" status
// AND "completed" (employee has submitted, but nobody has approved it yet),
// plus "in_progress" / "changes_requested". Only "approved" moves it out of
// Pending, and "rejected" is tracked separately. This keeps the Pending
// stat card honest: it doesn't quietly drop a task just because the
// employee submitted it — it only clears once an admin actually signs off
// on it.
export const isPendingStatus = (status: string): boolean =>
  !isDoneStatus(status) && status !== "rejected";

export const getTimeTakenMinutes = (
  startedAt?: string | null,
  deliveredAt?: string | null
): number | null => {
  if (!startedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = deliveredAt ? new Date(deliveredAt).getTime() : Date.now();
  const diffMs = end - start;
  return diffMs > 0 ? Math.floor(diffMs / 60000) : 0;
};

export const formatMinutes = (mins: number | null): string => {
  if (mins == null) return "—";
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ${hrs % 24}h`;
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  return `${mins}m`;
};

const dateOf = (t: Task): Date | null => {
  const raw =
    (t as unknown as { deliveredAt?: string | null; createdAt?: string }).deliveredAt ||
    t.dueDate ||
    (t as unknown as { createdAt?: string }).createdAt;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

export const buildWeeklyBuckets = (tasks: Task[], weeksBack = 8): WeekBucket[] => {
  const now = new Date();
  const buckets: WeekBucket[] = [];

  for (let i = weeksBack - 1; i >= 0; i--) {
    const end = new Date(now);
    end.setDate(now.getDate() - i * 7);
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    buckets.push({
      label: `${start.getDate()}/${start.getMonth() + 1}`,
      rangeStart: start,
      rangeEnd: end,
      assigned: 0,
      completed: 0,
      rejected: 0,
    });
  }

  tasks.forEach((t) => {
    const d = dateOf(t);
    if (!d) return;
    const bucket = buckets.find((b) => d >= b.rangeStart && d <= b.rangeEnd);
    if (!bucket) return;
    bucket.assigned += 1;
    if (isDoneStatus(t.status)) bucket.completed += 1;
    bucket.rejected += countRejectionCycles(t);
  });

  return buckets;
};

export const buildMonthlyBuckets = (tasks: Task[], monthsBack = 6): MonthBucket[] => {
  const now = new Date();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const buckets: MonthBucket[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      label: `${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`,
      assigned: 0,
      completed: 0,
      rejected: 0,
    });
  }

  tasks.forEach((t) => {
    const d = dateOf(t);
    if (!d) return;
    const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    const idx = monthsBack - 1 - monthsAgo;
    if (idx < 0 || idx >= buckets.length) return;
    buckets[idx].assigned += 1;
    if (isDoneStatus(t.status)) buckets[idx].completed += 1;
    buckets[idx].rejected += countRejectionCycles(t);
  });

  return buckets;
};

export const computeProgressScore = (tasks: Task[]): ProgressScoreResult => {
  const total = tasks.length;
  const completed = tasks.filter((t) => isDoneStatus(t.status)).length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  const totalRejections = tasks.reduce((sum, t) => sum + countRejectionCycles(t), 0);
  const rejectionPenalty = Math.min(40, totalRejections * 5);

  const score = Math.max(0, Math.min(100, completionRate - rejectionPenalty));

  return { score, completionRate, rejectionPenalty, totalRejections };
};

export const computeEmployeeProgressStats = (
  allTasks: Task[],
  employeeId: string
): EmployeeProgressStats => {
  const tasks = getTasksForEmployee(allTasks, employeeId);

  const completedTasks = tasks.filter((t) => isDoneStatus(t.status)).length;
  const pendingTasks = tasks.filter((t) => isPendingStatus(t.status)).length;
  const approvedTasks = tasks.filter((t) => t.status === "approved").length;
  const rejectedTasks = tasks.filter((t) => t.status === "rejected").length;
  const inProgressTasks = tasks.filter(
    (t) => (t.status as string) === "in_progress" || (t.status as string) === "changes_requested"
  ).length;
  const deliveredCount = tasks.filter((t) => t.deliveryStatus === "delivered").length;
  const notDeliveredCount = tasks.length - deliveredCount;

  const totalRejectionCycles = tasks.reduce((sum, t) => sum + countRejectionCycles(t), 0);

  const timesTaken = tasks
    .map((t) => {
      const tAny = t as unknown as { startedAt?: string | null; deliveredAt?: string | null };
      return { title: t.title, mins: getTimeTakenMinutes(tAny.startedAt, tAny.deliveredAt) };
    })
    .filter((x): x is { title: string; mins: number } => x.mins != null);

  const avgTimeTakenMinutes =
    timesTaken.length > 0
      ? Math.round(timesTaken.reduce((s, x) => s + x.mins, 0) / timesTaken.length)
      : null;

  const sortedByTime = [...timesTaken].sort((a, b) => a.mins - b.mins);
  const fastest = sortedByTime[0];
  const slowest = sortedByTime[sortedByTime.length - 1];

  const statusColors: Record<string, string> = {
    completed: "#10b981",
    pending: "#f59e0b",
    approved: "#3b82f6",
    rejected: "#ef4444",
    in_progress: "#6366f1",
    changes_requested: "#8b5cf6",
  };

  const statusCounts: Record<string, number> = {};
  tasks.forEach((t) => {
    statusCounts[t.status] = (statusCounts[t.status] ?? 0) + 1;
  });

  const statusBreakdown = Object.entries(statusCounts).map(([status, value]) => ({
    label: status.replace("_", " "),
    value,
    color: statusColors[status] ?? "#94a3b8",
  }));

  return {
    totalTasks: tasks.length,
    completedTasks,
    pendingTasks,
    approvedTasks,
    rejectedTasks,
    inProgressTasks,
    deliveredCount,
    notDeliveredCount,
    totalRejectionCycles,
    avgTimeTakenMinutes,
    avgTimeTakenLabel: formatMinutes(avgTimeTakenMinutes),
    fastestTaskLabel: fastest ? `${fastest.title} (${formatMinutes(fastest.mins)})` : "—",
    slowestTaskLabel: slowest ? `${slowest.title} (${formatMinutes(slowest.mins)})` : "—",
    progress: computeProgressScore(tasks),
    weekly: buildWeeklyBuckets(tasks, 8),
    monthly: buildMonthlyBuckets(tasks, 6),
    statusBreakdown,
  };
};