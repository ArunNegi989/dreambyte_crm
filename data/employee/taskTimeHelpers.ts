import { Task } from '../../types/employee/task';

/**
 * Returns a human-readable duration between the employee-entered startedAt
 * (date + time) and completedAt (date + time), e.g. "2h 15m", "45m", "1d 3h".
 * Returns null if either is missing (task not started/completed yet).
 */
export function getTimeTaken(task: Task): string | null {
  if (!task.startedAt || !task.completedAt) return null;

  const start = new Date(task.startedAt);
  const end = new Date(task.completedAt);
  const diffMs = end.getTime() - start.getTime();

  if (diffMs <= 0) return '0m';

  const totalMinutes = Math.round(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

/**
 * Total change requests ever made on a task (including resolved ones).
 * This is just changeRequests.length since requests are never deleted,
 * only marked resolved.
 */
export function getTotalChangeCount(task: Task): number {
  return task.changeRequests.length;
}