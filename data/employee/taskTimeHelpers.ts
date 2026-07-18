import { Task } from '../../types/employee/task';

/**
 * Returns a human-readable "time taken" label.
 *
 * ── THE FIX: this used to compute a raw startedAt -> deliveredAt wall-clock
 * diff. That formula quietly breaks the moment a task goes through a
 * reject / changes_requested -> Resume Task cycle: starting/resuming a task
 * intentionally leaves deliveredAt cleared on resume (so the OLD delivered
 * timestamp doesn't get treated as an "end"), which means the diff falls
 * back to (now - startedAt) — the task's ORIGINAL start time, potentially
 * days ago — completely ignoring any time it spent paused while waiting on
 * the rejection/changes. The number balloons and looks like a runaway timer.
 *
 * The backend already tracks the correct, pause-aware total in
 * timeSpentMs (accumulated every time the timer is stopped) plus whatever
 * the currently-running session has added on top (currentSessionStartedAt).
 * This is the exact same formula the Super Admin dashboard (SATasks.tsx)
 * and Admin dashboard (Tasktable.tsx) use, so every dashboard now always
 * shows the identical number for the same task, in every state (running,
 * paused on rejection, resumed, delivered).
 *
 * Returns null if the task was never started at all (no time accumulated
 * and no session currently running).
 * Examples: "2h 15m", "45m", "1d 3h", "<1m"
 */
export function getTimeTaken(task: Task): string | null {
  let totalMs = task.timeSpentMs || 0;

  if (task.currentSessionStartedAt) {
    const elapsed = Date.now() - new Date(task.currentSessionStartedAt).getTime();
    if (elapsed > 0) totalMs += elapsed;
  }

  if (totalMs <= 0) return null;

  const totalMinutes = Math.floor(totalMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const days = Math.floor(hours / 24);
  const minutes = totalMinutes % 60;

  if (days > 0) return hours % 24 > 0 ? `${days}d ${hours % 24}h` : `${days}d`;
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return '<1m';
}

/**
 * Raw millisecond version of getTimeTaken() — used for sorting (e.g. "time
 * taken" ascending/descending in Task History) where a comparable number is
 * needed instead of a formatted label. Same pause-aware formula as above.
 * Returns -1 if the task was never started (so callers can push it to the
 * end of a sort, matching the old "missing timestamp" behavior).
 */
export function getTimeTakenMs(task: Task): number {
  let totalMs = task.timeSpentMs || 0;

  if (task.currentSessionStartedAt) {
    const elapsed = Date.now() - new Date(task.currentSessionStartedAt).getTime();
    if (elapsed > 0) totalMs += elapsed;
  }

  return totalMs > 0 ? totalMs : -1;
}

/**
 * Total change requests ever made on a task (including resolved ones).
 * Requests are never deleted, only marked resolved.
 */
export function getTotalChangeCount(task: Task): number {
  return Array.isArray(task.changeRequests) ? task.changeRequests.length : 0;
}

/**
 * ── THE FIX (pause-aware version) ── takes timeSpentMs + currentSessionStartedAt
 * directly so it can be used anywhere without importing the employee Task
 * type — e.g. from admin/super-admin code working with a raw task object.
 * Same formula as getTimeTaken() above. Prefer this over
 * getTimeTakenFromDates() below for any new code.
 * Returns null if there's no accumulated time and nothing currently running.
 * Examples: "2h 15m", "45m", "1d 3h"
 */
export function getTimeTakenFromFields(
  timeSpentMs: number | null | undefined,
  currentSessionStartedAt: string | null | undefined
): string | null {
  let totalMs = timeSpentMs || 0;

  if (currentSessionStartedAt) {
    const elapsed = Date.now() - new Date(currentSessionStartedAt).getTime();
    if (elapsed > 0) totalMs += elapsed;
  }

  if (totalMs <= 0) return null;

  const totalMinutes = Math.floor(totalMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const days = Math.floor(hours / 24);
  const minutes = totalMinutes % 60;

  if (days > 0) return hours % 24 > 0 ? `${days}d ${hours % 24}h` : `${days}d`;
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  return `${minutes}m`;
}

/**
 * @deprecated Kept only for backward compatibility with any existing caller
 * passing raw (startedAt, deliveredAt). This has the SAME "balloons after a
 * reject -> Resume Task cycle" bug described on getTimeTaken() above,
 * because it has no access to timeSpentMs/currentSessionStartedAt — a plain
 * date diff can't be made pause-aware without those fields. Do not use this
 * for any new code; use getTimeTakenFromFields(timeSpentMs,
 * currentSessionStartedAt) instead, which is what every dashboard's
 * "Time Taken" column now actually reads from.
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