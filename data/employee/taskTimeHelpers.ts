import { Task } from '../../types/employee/task';

/**
 * Returns a human-readable "time taken" label — TOTAL ELAPSED time from
 * startedAt to deliveredAt (same as the Super Admin panel), NOT just the
 * active-timer worked time. This intentionally includes any time the task
 * sat waiting on a rejection/review cycle, so employee and admin views
 * always show the same number for the same task.
 *
 * If the task hasn't been delivered yet but is currently running
 * (currentSessionStartedAt set), the "end" is treated as now, so the
 * number keeps ticking up live while work is in progress.
 *
 * Returns null if the task was never started at all.
 * Examples: "2h 15m", "45m", "1d 3h", "<1m"
 */
export function getTimeTaken(task: Task): string | null {
  if (!task.startedAt) return null;

  const start = new Date(task.startedAt).getTime();
  const end = task.deliveredAt
    ? new Date(task.deliveredAt).getTime()
    : Date.now(); // still in progress — count up to now

  const diffMs = end - start;
  if (diffMs <= 0) return null;

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const days = Math.floor(hours / 24);
  const minutes = totalMinutes % 60;

  if (days > 0) return hours % 24 > 0 ? `${days}d ${hours % 24}h` : `${days}d`;
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return '<1m';
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
 * used in SATasks.tsx and TaskTable.tsx without importing the employee Task
 * type. Same total-elapsed logic as getTimeTaken() above.
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