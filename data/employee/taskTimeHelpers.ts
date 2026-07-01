import { Task } from '../../types/employee/task';

/**
 * Returns a human-readable duration between the employee-entered startedAt
 * and deliveredAt (set by backend on every submit/resubmit).
 *
 * Uses deliveredAt — NOT completedAt — because the backend never saves
 * completedAt separately. deliveredAt is updated to NOW on every
 * submit/resubmit, so time naturally accumulates across reject cycles.
 *
 * Returns null if either is missing (task not yet submitted).
 * Examples: "2h 15m", "45m", "1d 3h"
 */
export function getTimeTaken(task: Task): string | null {
  if (!task.startedAt || !task.deliveredAt) return null;

  const start = new Date(task.startedAt);
  const end   = new Date(task.deliveredAt);
  const diffMs = end.getTime() - start.getTime();

  if (diffMs <= 0) return '0m';

  const totalMinutes = Math.round(diffMs / (1000 * 60));
  const days    = Math.floor(totalMinutes / (60 * 24));
  const hours   = Math.floor((totalMinutes % (60 * 24)) / 60);
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
 * Requests are never deleted, only marked resolved.
 */
export function getTotalChangeCount(task: Task): number {
  return Array.isArray(task.changeRequests) ? task.changeRequests.length : 0;
}

/**
 * Admin / Super-admin utility — takes raw ISO strings directly so it can be
 * used in SATasks.tsx and TaskTable.tsx without importing the employee Task type.
 * Returns null if either timestamp is missing or invalid.
 * Examples: "2h 15m", "45m", "1d 3h"
 */
export function getTimeTakenFromDates(
  startedAt: string | null | undefined,
  deliveredAt: string | null | undefined
): string | null {
  if (!startedAt || !deliveredAt) return null;

  const diffMs = new Date(deliveredAt).getTime() - new Date(startedAt).getTime();
  if (isNaN(diffMs) || diffMs <= 0) return null;

  const totalMinutes = Math.round(diffMs / (1000 * 60));
  const days    = Math.floor(totalMinutes / (60 * 24));
  const hours   = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}