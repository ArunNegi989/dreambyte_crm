"use client";

import { useCallback, useEffect, useState } from 'react';

export interface AdditionalTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  dueDate: string | null;
  createdAt: string;
}

// NOTE: There's no backend model/route for these yet, so they're stored
// per-browser in localStorage. They won't show up on another device, and an
// admin/super_admin can't currently see them. If you want these to persist
// server-side and be visible to admins, we'd need a small backend model +
// route (e.g. POST/GET /api/employee/additional-tasks) and this hook would
// swap its read/write calls for apiFetch calls instead.
const STORAGE_KEY = 'additionalTasks';

function readAll(): AdditionalTask[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(tasks: AdditionalTask[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // ignore storage errors
  }
}

export function useAdditionalTasks() {
  const [tasks, setTasks] = useState<AdditionalTask[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTasks(readAll());
    setLoaded(true);
  }, []);

  const addTask = useCallback((title: string, description: string, dueDate: string | null) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    setTasks((prev) => {
      const next: AdditionalTask[] = [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title: trimmedTitle,
          description: description.trim(),
          status: 'pending',
          dueDate: dueDate || null,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ];
      writeAll(next);
      return next;
    });
  }, []);

  const toggleStatus = useCallback((id: string) => {
    setTasks((prev) => {
      const next = prev.map((t) =>
        t.id === id
          ? { ...t, status: (t.status === 'pending' ? 'completed' : 'pending') as AdditionalTask['status'] }
          : t
      );
      writeAll(next);
      return next;
    });
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      writeAll(next);
      return next;
    });
  }, []);

  return { tasks, loaded, addTask, toggleStatus, removeTask };
}