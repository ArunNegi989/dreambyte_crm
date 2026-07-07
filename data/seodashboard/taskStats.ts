import { Task, DashboardStats, CATEGORY_OPTIONS } from '../../types/seodashboard/task';

export interface TaskGroup {
  dateKey: string;
  label: string;
  tasks: Task[];
}

function todayKey(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

// Groups tasks into Overdue / Today / Upcoming / Completed buckets, ordered
// so the most urgent work always surfaces first on the dashboard.
export function groupTasksByDueDate(tasks: Task[]): TaskGroup[] {
  const today = todayKey();
  const buckets: Record<string, Task[]> = {
    overdue: [],
    today: [],
    upcoming: [],
    completed: [],
  };

  tasks.forEach((task) => {
    if (task.status === 'completed') {
      buckets.completed.push(task);
      return;
    }
    if (task.dueDate < today) {
      buckets.overdue.push(task);
    } else if (task.dueDate === today) {
      buckets.today.push(task);
    } else {
      buckets.upcoming.push(task);
    }
  });

  const groups: TaskGroup[] = [
    { dateKey: 'overdue', label: 'Overdue', tasks: buckets.overdue },
    { dateKey: 'today', label: 'Due today', tasks: buckets.today },
    { dateKey: 'upcoming', label: 'Upcoming', tasks: buckets.upcoming },
    { dateKey: 'completed', label: 'Recently completed', tasks: buckets.completed },
  ];

  return groups.filter((g) => g.tasks.length > 0);
}

export function computeDashboardStats(tasks: Task[], additionalCount: number): DashboardStats {
  const today = todayKey();
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const pending = tasks.filter((t) => t.status === 'pending').length;
  const blocked = tasks.filter((t) => t.status === 'blocked').length;
  const overdue = tasks.filter((t) => t.status !== 'completed' && t.dueDate < today).length;

  const breakdownMap = new Map<string, number>();
  CATEGORY_OPTIONS.forEach((c) => breakdownMap.set(c.value, 0));
  tasks.forEach((t) => breakdownMap.set(t.category, (breakdownMap.get(t.category) || 0) + 1));

  const categoryBreakdown = CATEGORY_OPTIONS
    .map((c) => ({ category: c.value, count: breakdownMap.get(c.value) || 0 }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    total,
    completed,
    inProgress,
    pending,
    blocked,
    overdue,
    additionalTasksLogged: additionalCount,
    categoryBreakdown,
    completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}
