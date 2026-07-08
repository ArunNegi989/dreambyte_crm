"use client";

import { useCallback, useEffect, useState } from 'react';

export interface Subtask {
  id: string;
  title: string;
  status: 'pending' | 'completed';
  createdAt: string;
}

function storageKey(taskId: string) {
  return `subtasks:${taskId}`;
}

function readSubtasks(taskId: string): Subtask[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey(taskId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeSubtasks(taskId: string, subtasks: Subtask[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(taskId), JSON.stringify(subtasks));
  } catch {
    // ignore quota/storage errors, UI state still updates in-memory
  }
}

// Subtasks are a lightweight, client-only breakdown of a task (e.g. splitting
// "Build landing page" into "Set up repo", "Wire up API", "Deploy to staging").
// They live in localStorage keyed by task id — there's no backend model for
// them yet, so nothing here is synced across devices or to the server.
export function useSubtasks(taskId: string) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);

  useEffect(() => {
    setSubtasks(readSubtasks(taskId));
  }, [taskId]);

  const addSubtask = useCallback((title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setSubtasks((prev) => {
      const next: Subtask[] = [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title: trimmed,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ];
      writeSubtasks(taskId, next);
      return next;
    });
  }, [taskId]);

  const toggleSubtask = useCallback((id: string) => {
    setSubtasks((prev) => {
      const next = prev.map((s) =>
        s.id === id
          ? { ...s, status: (s.status === 'pending' ? 'completed' : 'pending') as Subtask['status'] }
          : s
      );
      writeSubtasks(taskId, next);
      return next;
    });
  }, [taskId]);

  const removeSubtask = useCallback((id: string) => {
    setSubtasks((prev) => {
      const next = prev.filter((s) => s.id !== id);
      writeSubtasks(taskId, next);
      return next;
    });
  }, [taskId]);

  return { subtasks, addSubtask, toggleSubtask, removeSubtask };
}